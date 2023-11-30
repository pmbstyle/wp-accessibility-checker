<?php
/**
 * Plugin Name: Light Accessibility Checker
 * Description: Checks pages for text-to-speech, keyboard navigation, color contrast, and alt text.
 * Version: 1.1.0
 * Author: Slava Trofimov
 */

 function accessibility_checker_admin_bar_button($wp_admin_bar) {
    if (!is_admin() && current_user_can('manage_options')) {
        $args = array(
            'id' => 'accessibility_checker_button',
            'title' => 'Run Accessibility Tests',
            'href' => '#',
            'meta' => array(
                'class' => 'accessibility-checker-button',
                'onclick' => 'runAccessibilityTests();',
            )
        );
        $wp_admin_bar->add_node($args);
    }
}
add_action('admin_bar_menu', 'accessibility_checker_admin_bar_button', 100);

function accessibility_checker_enqueue_scripts() {
    if (!is_admin() && current_user_can('manage_options')) {
        wp_enqueue_script('accessibility-checker-script', plugin_dir_url(__FILE__) . 'js/accessibility-checker.js', array('jquery'), '1.0.0', true);
        wp_enqueue_style('accessibility-checker-style', plugin_dir_url(__FILE__) . 'css/accessibility-checker.css');
    }
}
add_action('wp_enqueue_scripts', 'accessibility_checker_enqueue_scripts');

add_action('wp_ajax_run_accessibility_test', 'handle_accessibility_test');

function handle_accessibility_test() {
    // Check for user permissions and nonce validity
    if (!current_user_can('manage_options')) {
        wp_die('You do not have sufficient permissions to access this page.');
    }

    check_ajax_referer('accessibility_checker_nonce_action', 'nonce');

    $pageUrl = isset($_POST['pageUrl']) ? $_POST['pageUrl'] : '';

    if (!filter_var($pageUrl, FILTER_VALIDATE_URL)) {
        echo 'Invalid URL';
        wp_die();
    }

    echo 'Testing: ' . esc_url($pageUrl);
    wp_die();
}