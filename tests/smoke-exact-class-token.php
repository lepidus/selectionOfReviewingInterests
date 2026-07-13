<?php

require_once dirname(__DIR__) . '/classes/HookCallbacks.inc.php';

$hookCallbacks = new HookCallbacks(null);
$method = new ReflectionMethod(HookCallbacks::class, 'hasClassToken');
$method->setAccessible(true);

$cases = [
    'interests' => true,
    'foo interests bar' => true,
    'interests-extra' => false,
    'foo-interests' => false,
];

foreach ($cases as $classAttribute => $expected) {
    $actual = $method->invoke($hookCallbacks, '<div class="' . $classAttribute . '"></div>', 'interests');
    if ($actual !== $expected) {
        fwrite(STDERR, sprintf("class=\"%s\": expected %s, got %s\n", $classAttribute, $expected ? 'true' : 'false', $actual ? 'true' : 'false'));
        exit(1);
    }
}

fwrite(STDOUT, "Exact class token smoke test passed.\n");
