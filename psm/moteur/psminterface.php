<?php

interface PSMInterface {

	//
	// Generates a PDF preview to the browser
	// @param document: file path to the .psmd file
	// @param data: file path to the data file (in a PSM supported format)
	// @param from: start preview at this record nr
	// @param to: end preview at this record nr
	//
	function PDFPreview($document,$data,$from,$to);
	
	//
	// Generates PDF output to the browser
	// @param document: file path to the .psmd file
	// @param data: file path to the data file (in a PSM supported format)
	// @param from: start at this record nr
	// @param to: end at this record nr
	//
	function PDFOutput($document,$data,$from,$to);
	
	//
	// Generates PDF output to file 
	// @param document: file path to the .psmd file
	// @param data: file path to the data file (in a PSM supported format)
	// @param from: start at this record nr
	// @param to: end at this record nr
	//
	function PDFOutputToFile($document,$data,$from,$to,$file);

	//
	// Generates printed output for the given printer
	// @param document: file path to the .psmd file
	// @param data: file path to the data file (in a PSM supported format)
	// @param from: start at this record nr
	// @param to: end at this record nr
	// @param printer: the system name of the printer
	//
	function PrintDocument($document,$data,$from,$to,$printer);
	
	//
	// Generates printed output for the given printer
	// @param document: file path to the .psmd file
	// @param data: file path to the data file (in a PSM supported format)
	// @param from: start at this record nr
	// @param to: end at this record nr
	// @param printer: the system name of the printer
	// @param file: the file name of the printer
	//
	public function PrintToFile($document,$data,$from,$to,$printer,$file);
	
	//
	// create a JPEG preview and send the result to the browser
	// @param document the path to the PSM document
	// @param data the path to the database file
	// @param layout the layout number to show(starts counting at 1)
	//
	public function JPEGPreview($document,$data,$layout);
	
  public function JPEGPreviewAllLayouts($document,$data,$layoutcount,$user_id=1);
}


?>