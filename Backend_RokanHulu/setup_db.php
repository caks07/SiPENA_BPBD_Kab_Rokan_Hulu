<?php
$host = '127.0.0.1';
$user = 'postgres';
$pass = '0715';

try {
    $pdo = new PDO("pgsql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query("SELECT 1 FROM pg_database WHERE datname = 'sipena'");
    if (!$stmt->fetch()) {
        $pdo->exec("CREATE DATABASE sipena");
        echo "Database sipena created.\n";
    } else {
        echo "Database sipena already exists.\n";
    }
    
    // Connect to sipena to create extension
    $pdoSipena = new PDO("pgsql:host=$host;dbname=sipena", $user, $pass);
    $pdoSipena->exec("CREATE EXTENSION IF NOT EXISTS postgis;");
    echo "PostGIS enabled.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
