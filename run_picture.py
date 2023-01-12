import requests
import subprocess

# Make the HTTP request to get the settings
response = requests.get('http://localhost:5001/get_settings')

# Decode the JSON response
settings = response.json()

# Extract the values from the response and store them in variables
demo_nr = settings['D']
led_gpio_mapping = settings['led_gpio_mapping']
led_rows = settings['led_rows']
led_cols = settings['led_cols']
led_chain = settings['led_chain']
led_parallel = settings['led_parallel']
led_multiplexing = settings['led_multiplexing']
led_pixel_mapper = settings['led_pixel_mapper']
led_pwm_bits = settings['led_pwm_bits']
led_brightness = settings['led_brightness']
led_scan_mode = settings['led_scan_mode']
led_row_addr_type = settings['led_row_addr_type']
led_show_refresh = settings['led_show_refresh']
led_limit_refresh = settings['led_limit_refresh']
led_inverse = settings['led_inverse']
led_rgb_sequence = settings['led_rgb_sequence']
led_pwm_lsb_nanoseconds = settings['led_pwm_lsb_nanoseconds']
led_pwm_dither_bits = settings['led_pwm_dither_bits']
led_no_hardware_pulse = settings['led_no_hardware_pulse']
led_panel_type = settings['led_panel_type']
led_slowdown_gpio = settings['led_slowdown_gpio']
led_daemon = settings['led_daemon']
led_no_drop_privs = settings['led_no_drop_privs']


#Build the command to run the demo
command = [
'/home/hemang/rpi-rgb-led-matrix/examples-api-use/demo',
'-D', str(demo_nr),
'--led-gpio-mapping=' + led_gpio_mapping,
'--led-rows=' + str(led_rows),
'--led-cols=' + str(led_cols),
'--led-chain=' + str(led_chain),
'--led-parallel=' + str(led_parallel),
'--led-multiplexing=' + str(led_multiplexing),
'--led-pixel-mapper=' + led_pixel_mapper,
'--led-pwm-bits=' + str(led_pwm_bits),
'--led-brightness=' + str(led_brightness),
'--led-scan-mode=' + str(led_scan_mode),
'--led-row-addr-type=' + str(led_row_addr_type)
]

if led_show_refresh:
    command.append('--led-show-refresh')

if led_limit_refresh:
    command.append('--led-limit-refresh=' + str(led_limit_refresh))

if led_inverse:
    command.append('--led-inverse')

command.append('--led-rgb-sequence=' + led_rgb_sequence)
command.append('--led-pwm-lsb-nanoseconds=' + str(led_pwm_lsb_nanoseconds))

if led_pwm_dither_bits:
    command.append('--led-pwm-dither-bits=' + str(led_pwm_dither_bits))

if led_no_hardware_pulse:
    command.append('--led-no-hardware-pulse')

if led_panel_type:
    command.append('--led-panel-type=' + led_panel_type)

if led_slowdown_gpio:
    command.append('--led-slowdown-gpio=' + str(led_slowdown_gpio))

if led_daemon:
    command.append('--led-daemon')

if led_no_drop_privs:
    command.append('--led-no-drop-privs')

#Run the command
subprocess.run(command)
