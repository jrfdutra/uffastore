<?php
/**
 * Uffa Store Theme Functions
 */

function uffa_enqueue_assets() {
    // Carrega o CSS compilado pelo Tailwind
    wp_enqueue_style('uffa-style', get_template_directory_uri() . '/dist/style.css', [], '1.0');
}
add_action('wp_enqueue_scripts', 'uffa_enqueue_assets');

// Registra menus
register_nav_menus([
    'primary' => __('Menu Principal', 'uffa-store'),
]);
