<?php

error_reporting(E_ALL & ~E_NOTICE);
require('phpagi.php');

$root = dirname(__DIR__);

$agi = new AGI();
$agi->answer();
$id = $agi->getVar('id');
$source = $agi->getVar('source');

$agi->conlog("cd $root/core && node callResult.js $id pickup");
$r = `cd $root/core && node callResult.js $id pickup`;
$agi->conlog($r);

$r = $agi->getDigit(__DIR__.'/sound/'.$source);

if (isset($r['data']) and $r['data'] === 'timeout') {
    $accepted = 'timeout';
} else {
    $keys = $r['result'];
    $accepted = $keys === '1' ? '1' : '0';
}

//$agi->conlog(':::::::::::::::::::'.$r['result'].'---'.gettype($r['result']));

$r = `cd $root/core && node callResult.js $id answered $accepted`;
$agi->conlog($r);
$agi->hangup();
