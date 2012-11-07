<?php

$elements = $_GET['tutorialElements'];
// Open XML file that contains the configuration.
$doc = new DOMDocument();
$doc->load('config.xml');
$xpath = new DOMXPath($doc);
$elements = $xpath->query('//UserTutorialConfiguration/Element');

if ($elements->length > 0) {
		$returnJson = array();
    foreach ($elements as $element) {
    		$obj = new stdClass();
				$obj->name = $element->getAttribute('id');
				$obj->text = $element->nodeValue;
				
    		$returnJson[] = $obj; 
    }
		
		header('Content-type: application/json');
		echo json_encode($returnJson);
}