<?php
/**
 * PSM Thread - Service worker pour PrintShop Mail
 * 
 * VERSION CORRIGÉE V3 - Rechargement systématique
 * 
 * Approche: On force le rechargement du document à CHAQUE requête
 * car PrintShop Mail semble avoir un cache interne imprévisible.
 * 
 * @author Objectif Lune (original)
 * @modified 2025-12-29 - V3: Rechargement systématique du document
 */

include_once("psmremote.php");
include_once("psminterface.php");

//
// Start a service thread, clients should use PSM_launch(...) instead 
//
function PSM_start($port) {
    $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    socket_bind($socket,"localhost");

    if (socket_connect($socket,"localhost",$port)) {
        socket_close($socket);
        return null; // already up
    }
    
    $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    if (!socket_bind($socket, "localhost", $port)) {
        return null; // race/collision
    }
    return new PSMThread($port, $socket);
}

//
// Service thread that wraps a PSM com instance
//
class PSMThread extends PSMService implements PSMInterface {    
    private $psm = null;
    private $stopPSM = false;
    private $handledCount = 0;

    private $profileOpenTemplate = 0;
    private $profileOpenData = 0;

    //
    // onBoot, 'BOOT' initialize phase before 'UP' 
    //
    function onBoot() {
        $this->refreshPSM();
        // listen to progress events
        com_event_sink($this->psm, $this, "Progress");
    }

    //
    // PSM COM Progress callback function
    //
    function Progress($percentage, &$result) {
        $socket = $this->getIOSocket();
        
        if ($socket === null || $socket === false) {
            $result = $this->stopPSM;
            return;
        }
        
        $read   = array($socket);
        $write  = NULL;
        $except = NULL;    
        if (@socket_select($read, $write, $except, 0) == 1) {
            $msg = @socket_read($socket, 100, PHP_NORMAL_READ);    
            if ($msg !== false && strcmp($msg, "STOP") == 0) {
                $this->stopPSM = true;
            }
        }
        
        @socket_write($socket, "PROGRESS: " . $percentage . "\n");
        $result = $this->stopPSM;
    }
    
    //
    // Generates a PDF preview to the browser
    //
    public function PDFPreview($document, $data, $from, $to) {
        $this->doOpen($document, $data);
        $pdf = tempnam(sys_get_temp_dir(), "PSM");
        
        error_log_debug("PDFPreview: Begin CreatePDF");
        $this->psm->CreatePDF($from, $to, FALSE, FALSE, $pdf);    
        error_log_debug("PDFPreview: End CreatePDF");
        
        $this->sendFile($pdf, "application/pdf", TRUE);
        return true;
    }
    
    //
    // Generates PDF output to the browser
    //
    public function PDFOutput($document, $data, $from, $to) {
        $this->doOpen($document, $data);
        $pdf = tempnam(sys_get_temp_dir(), "PSM");
        $this->psm->CreatePDF($from, $to, FALSE, FALSE, $pdf);
        $this->sendFile($pdf, "application/pdf", TRUE);
        return true; 
    }
    
    //
    // Generates PDF output to file 
    //
    public function PDFOutputToFile($document, $data, $from, $to, $file) {
        $this->doOpen($document, $data);
        $this->psm->CreatePDF($from, $to, FALSE, FALSE, $file);
        return true;    
    }

    //
    // Generates printed output for the given printer
    //
    public function PrintDocument($document, $data, $from, $to, $printer) {
        $this->doOpen($document, $data);
        if ($printer)
            $this->psm->selectPrinter($printer);
        else
            $this->psm->resetPrinter();
        $this->psm->printRecordRange($from, $to);
        return true;
    }
    
    //
    // Generates printed output for the given printer to file
    //
    public function PrintToFile($document, $data, $from, $to, $printer, $file) {
        $this->doOpen($document, $data);
        if ($printer)
            $this->psm->SelectPrinter($printer);
        else
            $this->psm->ResetPrinter();
        $tempfile = $this->psm->PrintToFile($from, $to);
        rename($tempfile, $file);
        return true;
    }
    
    //
    // create a JPEG preview and send the result to the browser
    //
    public function JPEGPreview($document, $data, $layout) {
        global $psmconfig;
        $profileStart = microtime(true);
        error_log_debug("Open");
        $this->doOpen($document, $data);
    
        error_log_debug("Quality");
        $this->psm->SetJPEGQuality(300, 100);
        $profileSetQuality = microtime(true);
    
        if (strcmp(gettype($layout), "string") == 0)
            $layout = intval($layout);
        error_log_debug("Create JPeg");
        $contents = $this->psm->CreateJPEGPreviewOfLayout($layout);    
        $profileCreate = microtime(true);
   
        error_log_debug("Send data");
        $this->sendData($contents, "image/jpeg");
        $profileTransfer = microtime(true);

        // Convert abs times to timespans
        $profileTotal               = $profileTransfer - $profileStart;
        $profileTransfer            = $profileTransfer - $profileCreate;  
        $profileCreate              = $profileCreate - $profileSetQuality;
        $profileSetQuality          = $profileSetQuality - $this->profileOpenData;       
        $this->profileOpenData      = $this->profileOpenData - $this->profileOpenTemplate;
        $this->profileOpenTemplate  = $this->profileOpenTemplate - $profileStart;       
    
        error_log_debug("Write profiling info");
        if ($psmconfig->getProfile()) {
            error_log("$this->port: ".
                "OT:" . number_format($this->profileOpenTemplate, 3) . " " .
                "OD:" . number_format($this->profileOpenData, 3) . " " .
                "SQ:" . number_format($this->profileSetQuality, 3) . " " .
                "CR:" . number_format($profileCreate, 3) . " " .
                "TR:" . number_format($profileTransfer, 3) . " " .
                "TO:" . number_format($profileTotal, 3) . " TE=" . $document . " DA=" . $data . " LA=" . $layout);
        }
        return true;        
    }
  
    //
    // Create JPEG previews for all layouts
    //
    public function JPEGPreviewAllLayouts($document, $data, $layoutcount, $user_id = 1) {
        $this->log("JPEGPreviewAllLayouts start");
        if (!(($openResult = $this->doOpen($document, $data)) === true))
            return $openResult;

        $this->log("Start JPG generation");
        $this->psm->SetJPEGQuality(300, 100);    

        for ($i = 1; $i <= $layoutcount; $i++) {
            $myContents = "";
            $myFile = $_SERVER['DOCUMENT_ROOT'] . "/temp/layout$i.jpg";
            $this->log("file saved: $myFile");
            $contents = $this->psm->CreateJPEGPreviewOfLayout($i);    
                
            foreach ($contents as $byte) {
                $myContents .= chr($byte);
            }
            file_put_contents($myFile, $myContents);
        }
        return true;
    }
    
    //
    // VERSION V3: Ouvre le document et la base de données
    // 
    // STRATÉGIE: On ferme puis réouvre SYSTÉMATIQUEMENT le document à chaque requête
    // car PrintShop Mail a un comportement de cache imprévisible.
    //
    // @param document chemin vers le fichier .psmd
    // @param data chemin vers le fichier de données
    // @return true si succès, sinon lance une exception
    //
    private function doOpen($document, $data) {
        // Vérifier si le fichier existe
        if (!file_exists($document)) {
            throw new Exception("FAIL Document file does not exist: \"$document\".");
        }
        
        // V3: Toujours fermer le document d'abord pour vider le cache PSM
        $this->closeDocument();
        
        // V3: Toujours ouvrir le document (pas de cache)
        error_log_debug("doOpen: Opening document (no cache): $document");
        if (!$this->psm->OpenDocument($document)) {
            throw new Exception("FAIL Can't open document \"$document\".");
        }
        
        $this->profileOpenTemplate = microtime(true);
                
        // Ouvrir la base de données
        if (!$this->psm->OpenDatabase($data))
            throw new Exception("FAIL Can't open database \"$data\".");
        $this->profileOpenData = microtime(true);
        return true;
    }
  
    //
    // Actions à effectuer après chaque requête traitée
    //
    protected function afterRequestHandled() {
        // Fermer la base de données pour libérer le verrou
        $this->closeDatabase();
        
        // Rafraîchir PSM si nécessaire (après N requêtes)
        $this->refreshPSM();
    }
    
    //
    // Ferme le document actuellement ouvert dans PrintShop Mail
    // Cela force PSM à vider son cache et relire le fichier au prochain OpenDocument()
    //
    protected function closeDocument() {
        if ($this->psm === null) {
            return;
        }
        
        try {
            // Essayer CloseDocument() si la méthode existe
            @$this->psm->CloseDocument();
            error_log_debug("closeDocument: CloseDocument() called");
        } catch (Exception $e) {
            error_log_debug("closeDocument: CloseDocument() not available - " . $e->getMessage());
        } catch (Error $e) {
            error_log_debug("closeDocument: CloseDocument() error - " . $e->getMessage());
        }
    }
    
    //
    // Ferme la base de données pour libérer le verrou sur le fichier CSV
    //
    protected function closeDatabase() {
        if ($this->psm === null) {
            return;
        }
        
        try {
            @$this->psm->CloseDatabase();
            error_log_debug("closeDatabase: CloseDatabase() called");
        } catch (Exception $e) {
            error_log_debug("closeDatabase: Exception ignored - " . $e->getMessage());
        } catch (Error $e) {
            error_log_debug("closeDatabase: Error ignored - " . $e->getMessage());
        }
    }
  
    //
    // PSM refresher (required for >6000 requests per thread)
    //
    protected function refreshPSM() {
        if ($this->psm == null || $this->handledCount++ > 500) {
            $this->log("PSM instance refreshed");
            $this->psm = new COM("PrintShopMail60.AutomatedPrinting");
            com_event_sink($this->psm, $this, "Progress");
            $this->handledCount = 0;
        } 
    }
}
  
?>