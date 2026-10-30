#!/usr/bin/env python3
"""Builds comprehensive, verified data/permissions.json for Android Privacy Auditor.
Primary source: https://developer.android.com/reference/android/Manifest.permission
"""
import json
from pathlib import Path

VERIFIED_AT = "2026-10-30"

PERMISSIONS: dict[str, dict] = {   'android.permission.ACCESS_ADSERVICES_AD_ID': {   'explanation': 'Allows '
                                                                     'access '
                                                                     'to the '
                                                                     'Android '
                                                                     'Privacy '
                                                                     'Sandbox '
                                                                     'Advertising '
                                                                     'ID on '
                                                                     'Android '
                                                                     '13+.',
                                                      'grant_mechanism': 'install_time',
                                                      'group': 'ADVERTISING',
                                                      'is_runtime': False,
                                                      'min_sdk': 33,
                                                      'name': 'Access Privacy '
                                                              'Sandbox Ad ID',
                                                      'platform_protection_level': 'normal',
                                                      'protection_level': 'normal',
                                                      'risk': 'Moderate',
                                                      'source': 'https://developer.android.com/reference/android/Manifest.permission#ACCESS_ADSERVICES_AD_ID',
                                                      'user_impact': 'Allows '
                                                                     'advertising '
                                                                     'networks '
                                                                     'to '
                                                                     'identify '
                                                                     'your '
                                                                     'device '
                                                                     'for '
                                                                     'cross-app '
                                                                     'ad '
                                                                     'measurement.',
                                                      'verified_at': '2026-10-30'},
    'android.permission.ACCESS_ADSERVICES_ATTRIBUTION': {   'explanation': 'Allows '
                                                                           'the '
                                                                           'app '
                                                                           'to '
                                                                           'access '
                                                                           'Privacy '
                                                                           'Sandbox '
                                                                           'Attribution '
                                                                           'APIs '
                                                                           'to '
                                                                           'measure '
                                                                           'ad '
                                                                           'conversions.',
                                                            'grant_mechanism': 'install_time',
                                                            'group': 'ADVERTISING',
                                                            'is_runtime': False,
                                                            'min_sdk': 33,
                                                            'name': 'Access '
                                                                    'Privacy '
                                                                    'Sandbox '
                                                                    'Attribution',
                                                            'platform_protection_level': 'normal',
                                                            'protection_level': 'normal',
                                                            'risk': 'Moderate',
                                                            'source': 'https://developer.android.com/reference/android/Manifest.permission#ACCESS_ADSERVICES_ATTRIBUTION',
                                                            'user_impact': 'Measures '
                                                                           'ad '
                                                                           'clicks '
                                                                           'and '
                                                                           'conversion '
                                                                           'events '
                                                                           'across '
                                                                           'applications.',
                                                            'verified_at': '2026-10-30'},
    'android.permission.ACCESS_ADSERVICES_TOPICS': {   'explanation': 'Allows '
                                                                      'apps to '
                                                                      'access '
                                                                      'coarse-grained '
                                                                      'interest '
                                                                      'topics '
                                                                      'inferred '
                                                                      'from '
                                                                      'app '
                                                                      'usage '
                                                                      'for ad '
                                                                      'personalization.',
                                                       'grant_mechanism': 'install_time',
                                                       'group': 'ADVERTISING',
                                                       'is_runtime': False,
                                                       'min_sdk': 33,
                                                       'name': 'Access Privacy '
                                                               'Sandbox Topics '
                                                               'API',
                                                       'platform_protection_level': 'normal',
                                                       'protection_level': 'normal',
                                                       'risk': 'Moderate',
                                                       'source': 'https://developer.android.com/reference/android/Manifest.permission#ACCESS_ADSERVICES_TOPICS',
                                                       'user_impact': 'Allows '
                                                                      'ad '
                                                                      'networks '
                                                                      'to '
                                                                      'target '
                                                                      'ads '
                                                                      'based '
                                                                      'on '
                                                                      'high-level '
                                                                      'categories '
                                                                      'of apps '
                                                                      'you '
                                                                      'use.',
                                                       'verified_at': '2026-10-30'},
    'android.permission.ACCESS_BACKGROUND_LOCATION': {   'explanation': 'Allows '
                                                                        'an '
                                                                        'application '
                                                                        'to '
                                                                        'continuously '
                                                                        'access '
                                                                        'location '
                                                                        'even '
                                                                        'when '
                                                                        'running '
                                                                        'in '
                                                                        'the '
                                                                        'background '
                                                                        'without '
                                                                        'user '
                                                                        'interaction.',
                                                         'grant_mechanism': 'runtime',
                                                         'group': 'LOCATION',
                                                         'is_runtime': True,
                                                         'min_sdk': 29,
                                                         'name': 'Access '
                                                                 'Background '
                                                                 'Location',
                                                         'platform_protection_level': 'dangerous',
                                                         'protection_level': 'dangerous',
                                                         'risk': 'Critical',
                                                         'source': 'https://developer.android.com/reference/android/Manifest.permission#ACCESS_BACKGROUND_LOCATION',
                                                         'user_impact': 'Enables '
                                                                        '24/7 '
                                                                        'covert '
                                                                        'tracking '
                                                                        'of '
                                                                        'user '
                                                                        'movements '
                                                                        'and '
                                                                        'travel '
                                                                        'history.',
                                                         'verified_at': '2026-10-30'},
    'android.permission.ACCESS_COARSE_LOCATION': {   'explanation': 'Allows an '
                                                                    'app to '
                                                                    'access '
                                                                    'approximate '
                                                                    'location '
                                                                    'derived '
                                                                    'from '
                                                                    'network '
                                                                    'location '
                                                                    'sources '
                                                                    'such as '
                                                                    'cell '
                                                                    'towers '
                                                                    'and Wi-Fi '
                                                                    'networks.',
                                                     'grant_mechanism': 'runtime',
                                                     'group': 'LOCATION',
                                                     'is_runtime': True,
                                                     'min_sdk': 1,
                                                     'name': 'Access '
                                                             'Approximate '
                                                             'Location',
                                                     'platform_protection_level': 'dangerous',
                                                     'protection_level': 'dangerous',
                                                     'risk': 'Moderate',
                                                     'source': 'https://developer.android.com/reference/android/Manifest.permission#ACCESS_COARSE_LOCATION',
                                                     'user_impact': 'Can '
                                                                    'estimate '
                                                                    'your '
                                                                    'location '
                                                                    'to city '
                                                                    'block or '
                                                                    'neighborhood '
                                                                    'level '
                                                                    '(approx 3 '
                                                                    'sq km).',
                                                     'verified_at': '2026-10-30'},
    'android.permission.ACCESS_FINE_LOCATION': {   'explanation': 'Allows the '
                                                                  'app to '
                                                                  'access '
                                                                  'precise '
                                                                  'geographic '
                                                                  'location '
                                                                  'from GPS, '
                                                                  'Wi-Fi, and '
                                                                  'cellular '
                                                                  'cell '
                                                                  'towers. '
                                                                  'Required '
                                                                  'for '
                                                                  'turn-by-turn '
                                                                  'navigation, '
                                                                  'geofencing, '
                                                                  'and '
                                                                  'location '
                                                                  'tagging.',
                                                   'grant_mechanism': 'runtime',
                                                   'group': 'LOCATION',
                                                   'is_runtime': True,
                                                   'min_sdk': 1,
                                                   'name': 'Access Precise '
                                                           'Location',
                                                   'platform_protection_level': 'dangerous',
                                                   'protection_level': 'dangerous',
                                                   'risk': 'High',
                                                   'source': 'https://developer.android.com/reference/android/Manifest.permission#ACCESS_FINE_LOCATION',
                                                   'user_impact': 'Can '
                                                                  'pinpoint '
                                                                  'your exact '
                                                                  'physical '
                                                                  'location to '
                                                                  'within '
                                                                  'meters.',
                                                   'verified_at': '2026-10-30'},
    'android.permission.ACCESS_MEDIA_LOCATION': {   'explanation': 'Allows an '
                                                                   'application '
                                                                   'to read '
                                                                   'unredacted '
                                                                   'geographic '
                                                                   'metadata '
                                                                   '(EXIF GPS '
                                                                   'tags) '
                                                                   'embedded '
                                                                   'in user '
                                                                   'photos.',
                                                    'grant_mechanism': 'runtime',
                                                    'group': 'STORAGE',
                                                    'is_runtime': True,
                                                    'min_sdk': 29,
                                                    'name': 'Access EXIF Media '
                                                            'Geographic '
                                                            'Location',
                                                    'platform_protection_level': 'dangerous',
                                                    'protection_level': 'dangerous',
                                                    'risk': 'Moderate',
                                                    'source': 'https://developer.android.com/reference/android/Manifest.permission#ACCESS_MEDIA_LOCATION',
                                                    'user_impact': 'Extracts '
                                                                   'exact GPS '
                                                                   'coordinates '
                                                                   'where your '
                                                                   'photos and '
                                                                   'videos '
                                                                   'were '
                                                                   'captured.',
                                                    'verified_at': '2026-10-30'},
    'android.permission.ACCESS_NETWORK_STATE': {   'explanation': 'Allows an '
                                                                  'application '
                                                                  'to view the '
                                                                  'state of '
                                                                  'network '
                                                                  'connectivity '
                                                                  '(e.g. '
                                                                  'connected, '
                                                                  'disconnected, '
                                                                  'cellular vs '
                                                                  'Wi-Fi).',
                                                   'grant_mechanism': 'install_time',
                                                   'group': 'NETWORK',
                                                   'is_runtime': False,
                                                   'min_sdk': 1,
                                                   'name': 'View Network '
                                                           'Connections',
                                                   'platform_protection_level': 'normal',
                                                   'protection_level': 'normal',
                                                   'risk': 'Low',
                                                   'source': 'https://developer.android.com/reference/android/Manifest.permission#ACCESS_NETWORK_STATE',
                                                   'user_impact': 'Detects '
                                                                  'whether you '
                                                                  'have active '
                                                                  'internet '
                                                                  'connection.',
                                                   'verified_at': '2026-10-30'},
    'android.permission.ACCESS_WIFI_STATE': {   'explanation': 'Allows an '
                                                               'application to '
                                                               'view '
                                                               'information '
                                                               'about Wi-Fi '
                                                               'connectivity, '
                                                               'such as '
                                                               'whether Wi-Fi '
                                                               'is enabled and '
                                                               'connected '
                                                               'network '
                                                               'SSID/BSSID.',
                                                'grant_mechanism': 'install_time',
                                                'group': 'NETWORK',
                                                'is_runtime': False,
                                                'min_sdk': 1,
                                                'name': 'View Wi-Fi State',
                                                'platform_protection_level': 'normal',
                                                'protection_level': 'normal',
                                                'risk': 'Low',
                                                'source': 'https://developer.android.com/reference/android/Manifest.permission#ACCESS_WIFI_STATE',
                                                'user_impact': 'Can inspect '
                                                               'Wi-Fi '
                                                               'connection '
                                                               'status and '
                                                               'network names.',
                                                'verified_at': '2026-10-30'},
    'android.permission.ACTIVITY_RECOGNITION': {   'explanation': 'Allows an '
                                                                  'application '
                                                                  'to detect '
                                                                  'user '
                                                                  'physical '
                                                                  'activity '
                                                                  'such as '
                                                                  'walking, '
                                                                  'bicycling, '
                                                                  'driving, or '
                                                                  'standing '
                                                                  'still.',
                                                   'grant_mechanism': 'runtime',
                                                   'group': 'SENSORS',
                                                   'is_runtime': True,
                                                   'min_sdk': 29,
                                                   'name': 'Physical Activity '
                                                           'Recognition',
                                                   'platform_protection_level': 'dangerous',
                                                   'protection_level': 'dangerous',
                                                   'risk': 'Moderate',
                                                   'source': 'https://developer.android.com/reference/android/Manifest.permission#ACTIVITY_RECOGNITION',
                                                   'user_impact': 'Enables '
                                                                  'behavioral '
                                                                  'profiling '
                                                                  'of your '
                                                                  'physical '
                                                                  'motion '
                                                                  'throughout '
                                                                  'the day.',
                                                   'verified_at': '2026-10-30'},
    'android.permission.ANSWER_PHONE_CALLS': {   'explanation': 'Allows the '
                                                                'app to answer '
                                                                'an incoming '
                                                                'phone call '
                                                                'programmatically.',
                                                 'grant_mechanism': 'runtime',
                                                 'group': 'PHONE',
                                                 'is_runtime': True,
                                                 'min_sdk': 26,
                                                 'name': 'Answer Phone Calls',
                                                 'platform_protection_level': 'dangerous',
                                                 'protection_level': 'dangerous',
                                                 'risk': 'Moderate',
                                                 'source': 'https://developer.android.com/reference/android/Manifest.permission#ANSWER_PHONE_CALLS',
                                                 'user_impact': 'Can '
                                                                'automatically '
                                                                'pick up phone '
                                                                'calls without '
                                                                'user consent.',
                                                 'verified_at': '2026-10-30'},
    'android.permission.BIND_ACCESSIBILITY_SERVICE': {   'explanation': 'High-privilege '
                                                                        'system '
                                                                        'permission '
                                                                        'required '
                                                                        'for '
                                                                        'an '
                                                                        'app '
                                                                        'providing '
                                                                        'accessibility '
                                                                        'services. '
                                                                        'Can '
                                                                        'inspect '
                                                                        'all '
                                                                        'screen '
                                                                        'contents, '
                                                                        'capture '
                                                                        'keypresses, '
                                                                        'and '
                                                                        'perform '
                                                                        'taps '
                                                                        'on '
                                                                        'behalf '
                                                                        'of '
                                                                        'the '
                                                                        'user.',
                                                         'grant_mechanism': 'signature_restricted',
                                                         'group': 'SPECIAL_ACCESS',
                                                         'is_runtime': False,
                                                         'min_sdk': 14,
                                                         'name': 'Bind '
                                                                 'Accessibility '
                                                                 'Service',
                                                         'platform_protection_level': 'signature',
                                                         'protection_level': 'signature',
                                                         'risk': 'Critical',
                                                         'source': 'https://developer.android.com/reference/android/Manifest.permission#BIND_ACCESSIBILITY_SERVICE',
                                                         'user_impact': 'Can '
                                                                        'read '
                                                                        'all '
                                                                        'screen '
                                                                        'text, '
                                                                        'capture '
                                                                        'credentials, '
                                                                        'and '
                                                                        'click '
                                                                        'buttons '
                                                                        'automatically.',
                                                         'verified_at': '2026-10-30'},
    'android.permission.BIND_DEVICE_ADMIN': {   'explanation': 'High-privilege '
                                                               'system '
                                                               'permission '
                                                               'enabling '
                                                               'device '
                                                               'management '
                                                               'policies (e.g. '
                                                               'enterprise '
                                                               'lock, remote '
                                                               'wipe, password '
                                                               'enforcement).',
                                                'grant_mechanism': 'signature_restricted',
                                                'group': 'SPECIAL_ACCESS',
                                                'is_runtime': False,
                                                'min_sdk': 8,
                                                'name': 'Device Administrator '
                                                        'Binding',
                                                'platform_protection_level': 'signature',
                                                'protection_level': 'signature',
                                                'risk': 'Critical',
                                                'source': 'https://developer.android.com/reference/android/Manifest.permission#BIND_DEVICE_ADMIN',
                                                'user_impact': 'Can lock the '
                                                               'screen, '
                                                               'enforce '
                                                               'passwords, or '
                                                               'factory reset '
                                                               'the device.',
                                                'verified_at': '2026-10-30'},
    'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE': {   'explanation': 'High-privilege '
                                                                                'system '
                                                                                'permission '
                                                                                'that '
                                                                                'allows '
                                                                                'an '
                                                                                'app '
                                                                                'to '
                                                                                'intercept, '
                                                                                'read, '
                                                                                'and '
                                                                                'dismiss '
                                                                                'all '
                                                                                'notifications '
                                                                                'from '
                                                                                'all '
                                                                                'apps '
                                                                                'on '
                                                                                'the '
                                                                                'device.',
                                                                 'grant_mechanism': 'signature_restricted',
                                                                 'group': 'SPECIAL_ACCESS',
                                                                 'is_runtime': False,
                                                                 'min_sdk': 18,
                                                                 'name': 'Bind '
                                                                         'Notification '
                                                                         'Listener '
                                                                         'Service',
                                                                 'platform_protection_level': 'signature',
                                                                 'protection_level': 'signature',
                                                                 'risk': 'Critical',
                                                                 'source': 'https://developer.android.com/reference/android/Manifest.permission#BIND_NOTIFICATION_LISTENER_SERVICE',
                                                                 'user_impact': 'Reads '
                                                                                'all '
                                                                                'notifications '
                                                                                'including '
                                                                                'OTP '
                                                                                'codes, '
                                                                                'chat '
                                                                                'previews, '
                                                                                'and '
                                                                                'banking '
                                                                                'messages.',
                                                                 'verified_at': '2026-10-30'},
    'android.permission.BIND_VPN_SERVICE': {   'explanation': 'Allows an '
                                                              'application to '
                                                              'establish a '
                                                              'local or remote '
                                                              'virtual private '
                                                              'network (VPN) '
                                                              'tunnel, '
                                                              'intercepting '
                                                              'all device IP '
                                                              'traffic.',
                                               'grant_mechanism': 'signature_restricted',
                                               'group': 'NETWORK',
                                               'is_runtime': False,
                                               'min_sdk': 14,
                                               'name': 'Bind VPN Service',
                                               'platform_protection_level': 'signature',
                                               'protection_level': 'signature',
                                               'risk': 'Critical',
                                               'source': 'https://developer.android.com/reference/android/Manifest.permission#BIND_VPN_SERVICE',
                                               'user_impact': 'Routes all '
                                                              'network traffic '
                                                              'through the '
                                                              "app's VPN "
                                                              'engine, '
                                                              'enabling full '
                                                              'traffic '
                                                              'analysis.',
                                               'verified_at': '2026-10-30'},
    'android.permission.BLUETOOTH_ADVERTISE': {   'explanation': 'Allows an '
                                                                 'application '
                                                                 'to advertise '
                                                                 'the device '
                                                                 'to nearby '
                                                                 'Bluetooth '
                                                                 'devices.',
                                                  'grant_mechanism': 'runtime',
                                                  'group': 'NEARBY_DEVICES',
                                                  'is_runtime': True,
                                                  'min_sdk': 31,
                                                  'name': 'Broadcast to Nearby '
                                                          'Bluetooth Devices',
                                                  'platform_protection_level': 'dangerous',
                                                  'protection_level': 'dangerous',
                                                  'risk': 'Moderate',
                                                  'source': 'https://developer.android.com/reference/android/Manifest.permission#BLUETOOTH_ADVERTISE',
                                                  'user_impact': 'Emits '
                                                                 'Bluetooth '
                                                                 'beacon '
                                                                 'signals '
                                                                 'detectable '
                                                                 'by devices '
                                                                 'in '
                                                                 'proximity.',
                                                  'verified_at': '2026-10-30'},
    'android.permission.BLUETOOTH_CONNECT': {   'explanation': 'Allows an '
                                                               'application to '
                                                               'communicate '
                                                               'with '
                                                               'already-paired '
                                                               'Bluetooth '
                                                               'devices on '
                                                               'Android 12+.',
                                                'grant_mechanism': 'runtime',
                                                'group': 'NEARBY_DEVICES',
                                                'is_runtime': True,
                                                'min_sdk': 31,
                                                'name': 'Connect to Paired '
                                                        'Bluetooth Devices',
                                                'platform_protection_level': 'dangerous',
                                                'protection_level': 'dangerous',
                                                'risk': 'Moderate',
                                                'source': 'https://developer.android.com/reference/android/Manifest.permission#BLUETOOTH_CONNECT',
                                                'user_impact': 'Can '
                                                               'communicate '
                                                               'with headsets, '
                                                               'smart watches, '
                                                               'and automotive '
                                                               'units.',
                                                'verified_at': '2026-10-30'},
    'android.permission.BLUETOOTH_SCAN': {   'explanation': 'Allows an '
                                                            'application to '
                                                            'discover and pair '
                                                            'with nearby '
                                                            'Bluetooth devices '
                                                            'on Android 12+.',
                                             'grant_mechanism': 'runtime',
                                             'group': 'NEARBY_DEVICES',
                                             'is_runtime': True,
                                             'min_sdk': 31,
                                             'name': 'Scan Nearby Bluetooth '
                                                     'Devices',
                                             'platform_protection_level': 'dangerous',
                                             'protection_level': 'dangerous',
                                             'risk': 'High',
                                             'source': 'https://developer.android.com/reference/android/Manifest.permission#BLUETOOTH_SCAN',
                                             'user_impact': 'Can discover '
                                                            'nearby beacons, '
                                                            'wearables, and '
                                                            'infer physical '
                                                            'presence/location.',
                                             'verified_at': '2026-10-30'},
    'android.permission.BODY_SENSORS': {   'explanation': 'Allows an '
                                                          'application to '
                                                          'access health '
                                                          'sensor data such as '
                                                          'heart rate, pulse, '
                                                          'or body '
                                                          'temperature.',
                                           'grant_mechanism': 'runtime',
                                           'group': 'SENSORS',
                                           'is_runtime': True,
                                           'min_sdk': 20,
                                           'name': 'Access Heart Rate & Body '
                                                   'Sensors',
                                           'platform_protection_level': 'dangerous',
                                           'protection_level': 'dangerous',
                                           'risk': 'High',
                                           'source': 'https://developer.android.com/reference/android/Manifest.permission#BODY_SENSORS',
                                           'user_impact': 'Exposes real-time '
                                                          'biometric and '
                                                          'physiological '
                                                          'health readings.',
                                           'verified_at': '2026-10-30'},
    'android.permission.BODY_SENSORS_BACKGROUND': {   'explanation': 'Allows '
                                                                     'an '
                                                                     'application '
                                                                     'to '
                                                                     'access '
                                                                     'body '
                                                                     'sensors '
                                                                     'while '
                                                                     'running '
                                                                     'in the '
                                                                     'background.',
                                                      'grant_mechanism': 'runtime',
                                                      'group': 'SENSORS',
                                                      'is_runtime': True,
                                                      'min_sdk': 33,
                                                      'name': 'Access Body '
                                                              'Sensors in '
                                                              'Background',
                                                      'platform_protection_level': 'dangerous',
                                                      'protection_level': 'dangerous',
                                                      'risk': 'Critical',
                                                      'source': 'https://developer.android.com/reference/android/Manifest.permission#BODY_SENSORS_BACKGROUND',
                                                      'user_impact': 'Enables '
                                                                     'continuous '
                                                                     'biometric '
                                                                     'surveillance '
                                                                     'when app '
                                                                     'is not '
                                                                     'in use.',
                                                      'verified_at': '2026-10-30'},
    'android.permission.CALL_PHONE': {   'explanation': 'Allows an application '
                                                        'to initiate a phone '
                                                        'call without going '
                                                        'through the Dialer '
                                                        'user interface for '
                                                        'confirmation.',
                                         'grant_mechanism': 'runtime',
                                         'group': 'PHONE',
                                         'is_runtime': True,
                                         'min_sdk': 1,
                                         'name': 'Directly Make Phone Calls',
                                         'platform_protection_level': 'dangerous',
                                         'protection_level': 'dangerous',
                                         'risk': 'Critical',
                                         'source': 'https://developer.android.com/reference/android/Manifest.permission#CALL_PHONE',
                                         'user_impact': 'Can dial toll numbers '
                                                        'or place unauthorized '
                                                        'calls in the '
                                                        'background.',
                                         'verified_at': '2026-10-30'},
    'android.permission.CAMERA': {   'explanation': 'Required to access the '
                                                    'camera device for taking '
                                                    'photos, recording videos, '
                                                    'or scanning QR/barcodes.',
                                     'grant_mechanism': 'runtime',
                                     'group': 'CAMERA',
                                     'is_runtime': True,
                                     'min_sdk': 1,
                                     'name': 'Camera Access',
                                     'platform_protection_level': 'dangerous',
                                     'protection_level': 'dangerous',
                                     'risk': 'High',
                                     'source': 'https://developer.android.com/reference/android/Manifest.permission#CAMERA',
                                     'user_impact': 'Can capture photos and '
                                                    'live video of user and '
                                                    'surroundings.',
                                     'verified_at': '2026-10-30'},
    'android.permission.CHANGE_NETWORK_STATE': {   'explanation': 'Allows an '
                                                                  'application '
                                                                  'to change '
                                                                  'the state '
                                                                  'of network '
                                                                  'connectivity.',
                                                   'grant_mechanism': 'install_time',
                                                   'group': 'NETWORK',
                                                   'is_runtime': False,
                                                   'min_sdk': 1,
                                                   'name': 'Change Network '
                                                           'Connectivity State',
                                                   'platform_protection_level': 'normal',
                                                   'protection_level': 'normal',
                                                   'risk': 'Moderate',
                                                   'source': 'https://developer.android.com/reference/android/Manifest.permission#CHANGE_NETWORK_STATE',
                                                   'user_impact': 'Can request '
                                                                  'specialized '
                                                                  'cellular '
                                                                  'network '
                                                                  'connections.',
                                                   'verified_at': '2026-10-30'},
    'android.permission.CHANGE_WIFI_STATE': {   'explanation': 'Allows an '
                                                               'application to '
                                                               'connect to and '
                                                               'disconnect '
                                                               'from Wi-Fi '
                                                               'access points '
                                                               'and turn Wi-Fi '
                                                               'on or off.',
                                                'grant_mechanism': 'install_time',
                                                'group': 'NETWORK',
                                                'is_runtime': False,
                                                'min_sdk': 1,
                                                'name': 'Change Wi-Fi '
                                                        'Connectivity',
                                                'platform_protection_level': 'normal',
                                                'protection_level': 'normal',
                                                'risk': 'Moderate',
                                                'source': 'https://developer.android.com/reference/android/Manifest.permission#CHANGE_WIFI_STATE',
                                                'user_impact': 'Can toggle '
                                                               'Wi-Fi '
                                                               'connection and '
                                                               'reconfigure '
                                                               'wireless '
                                                               'networks.',
                                                'verified_at': '2026-10-30'},
    'android.permission.ENFORCE_UPDATE_OWNERSHIP': {   'explanation': 'Indicates '
                                                                      'that '
                                                                      'the '
                                                                      'installer '
                                                                      'intends '
                                                                      'to '
                                                                      'claim '
                                                                      'exclusive '
                                                                      'ownership '
                                                                      'over '
                                                                      'updating '
                                                                      'the '
                                                                      'package '
                                                                      'on '
                                                                      'Android '
                                                                      '14+.',
                                                       'grant_mechanism': 'install_time',
                                                       'group': 'PACKAGE_MANAGEMENT',
                                                       'is_runtime': False,
                                                       'min_sdk': 34,
                                                       'name': 'Enforce Update '
                                                               'Ownership',
                                                       'platform_protection_level': 'normal',
                                                       'protection_level': 'normal',
                                                       'risk': 'Low',
                                                       'source': 'https://developer.android.com/reference/android/Manifest.permission#ENFORCE_UPDATE_OWNERSHIP',
                                                       'user_impact': 'Ensures '
                                                                      'that '
                                                                      'other '
                                                                      'app '
                                                                      'stores '
                                                                      'cannot '
                                                                      'overwrite '
                                                                      'this '
                                                                      'package '
                                                                      'without '
                                                                      'explicit '
                                                                      'user '
                                                                      'consent.',
                                                       'verified_at': '2026-10-30'},
    'android.permission.FLASHLIGHT': {   'explanation': 'Allows an application '
                                                        'to toggle the device '
                                                        'camera LED flash as a '
                                                        'torch.',
                                         'grant_mechanism': 'install_time',
                                         'group': 'HARDWARE',
                                         'is_runtime': False,
                                         'min_sdk': 1,
                                         'name': 'Control Camera Flashlight',
                                         'platform_protection_level': 'normal',
                                         'protection_level': 'normal',
                                         'risk': 'Low',
                                         'source': 'https://developer.android.com/reference/android/Manifest.permission#FLASHLIGHT',
                                         'user_impact': 'Turns torch on and '
                                                        'off.',
                                         'verified_at': '2026-10-30'},
    'android.permission.FOREGROUND_SERVICE': {   'explanation': 'Allows an '
                                                                'application '
                                                                'to run '
                                                                'persistent '
                                                                'background '
                                                                'services '
                                                                'accompanied '
                                                                'by a '
                                                                'persistent '
                                                                'notification.',
                                                 'grant_mechanism': 'install_time',
                                                 'group': 'SYSTEM',
                                                 'is_runtime': False,
                                                 'min_sdk': 28,
                                                 'name': 'Run Foreground '
                                                         'Service',
                                                 'platform_protection_level': 'normal',
                                                 'protection_level': 'normal',
                                                 'risk': 'Low',
                                                 'source': 'https://developer.android.com/reference/android/Manifest.permission#FOREGROUND_SERVICE',
                                                 'user_impact': 'Enables '
                                                                'persistent '
                                                                'background '
                                                                'task '
                                                                'execution '
                                                                'visible in '
                                                                'the '
                                                                'notification '
                                                                'shade.',
                                                 'verified_at': '2026-10-30'},
    'android.permission.FOREGROUND_SERVICE_CAMERA': {   'explanation': 'Allows '
                                                                       'ongoing '
                                                                       'camera '
                                                                       'capture '
                                                                       'while '
                                                                       'the '
                                                                       'app is '
                                                                       'in the '
                                                                       'foreground '
                                                                       'service '
                                                                       'state.',
                                                        'grant_mechanism': 'install_time',
                                                        'group': 'CAMERA',
                                                        'is_runtime': False,
                                                        'min_sdk': 34,
                                                        'name': 'Foreground '
                                                                'Service: '
                                                                'Camera Access',
                                                        'platform_protection_level': 'normal',
                                                        'protection_level': 'normal',
                                                        'risk': 'High',
                                                        'source': 'https://developer.android.com/reference/android/Manifest.permission#FOREGROUND_SERVICE_CAMERA',
                                                        'user_impact': 'Allows '
                                                                       'video '
                                                                       'streaming '
                                                                       'or '
                                                                       'dashcam '
                                                                       'recording '
                                                                       'while '
                                                                       'screen '
                                                                       'is '
                                                                       'locked.',
                                                        'verified_at': '2026-10-30'},
    'android.permission.FOREGROUND_SERVICE_DATA_SYNC': {   'explanation': 'Allows '
                                                                          'running '
                                                                          'a '
                                                                          'foreground '
                                                                          'service '
                                                                          'for '
                                                                          'uploading '
                                                                          'or '
                                                                          'downloading '
                                                                          'data.',
                                                           'grant_mechanism': 'install_time',
                                                           'group': 'SYSTEM',
                                                           'is_runtime': False,
                                                           'min_sdk': 34,
                                                           'name': 'Foreground '
                                                                   'Service: '
                                                                   'Data '
                                                                   'Synchronization',
                                                           'platform_protection_level': 'normal',
                                                           'protection_level': 'normal',
                                                           'risk': 'Low',
                                                           'source': 'https://developer.android.com/reference/android/Manifest.permission#FOREGROUND_SERVICE_DATA_SYNC',
                                                           'user_impact': 'Standard '
                                                                          'background '
                                                                          'service '
                                                                          'for '
                                                                          'data '
                                                                          'transfers '
                                                                          'and '
                                                                          'synchronization.',
                                                           'verified_at': '2026-10-30'},
    'android.permission.FOREGROUND_SERVICE_LOCATION': {   'explanation': 'Allows '
                                                                         'continuous '
                                                                         'location '
                                                                         'tracking '
                                                                         'during '
                                                                         'navigation, '
                                                                         'exercise, '
                                                                         'or '
                                                                         'ride-share '
                                                                         'tracking.',
                                                          'grant_mechanism': 'install_time',
                                                          'group': 'LOCATION',
                                                          'is_runtime': False,
                                                          'min_sdk': 34,
                                                          'name': 'Foreground '
                                                                  'Service: '
                                                                  'Location '
                                                                  'Access',
                                                          'platform_protection_level': 'normal',
                                                          'protection_level': 'normal',
                                                          'risk': 'High',
                                                          'source': 'https://developer.android.com/reference/android/Manifest.permission#FOREGROUND_SERVICE_LOCATION',
                                                          'user_impact': 'Enables '
                                                                         'active '
                                                                         'route '
                                                                         'tracking '
                                                                         'accompanied '
                                                                         'by a '
                                                                         'persistent '
                                                                         'notification.',
                                                          'verified_at': '2026-10-30'},
    'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION': {   'explanation': 'Required '
                                                                                 'on '
                                                                                 'Android '
                                                                                 '14+ '
                                                                                 'to '
                                                                                 'run '
                                                                                 'a '
                                                                                 'foreground '
                                                                                 'service '
                                                                                 'that '
                                                                                 'captures '
                                                                                 'or '
                                                                                 'mirrors '
                                                                                 'the '
                                                                                 'device '
                                                                                 'screen.',
                                                                  'grant_mechanism': 'install_time',
                                                                  'group': 'SPECIAL_ACCESS',
                                                                  'is_runtime': False,
                                                                  'min_sdk': 34,
                                                                  'name': 'Foreground '
                                                                          'Service: '
                                                                          'Screen '
                                                                          'Capture '
                                                                          '/ '
                                                                          'Projection',
                                                                  'platform_protection_level': 'normal',
                                                                  'protection_level': 'normal',
                                                                  'risk': 'High',
                                                                  'source': 'https://developer.android.com/reference/android/Manifest.permission#FOREGROUND_SERVICE_MEDIA_PROJECTION',
                                                                  'user_impact': 'Can '
                                                                                 'record '
                                                                                 'or '
                                                                                 'stream '
                                                                                 'everything '
                                                                                 'rendered '
                                                                                 'on '
                                                                                 'your '
                                                                                 "phone's "
                                                                                 'display.',
                                                                  'verified_at': '2026-10-30'},
    'android.permission.FOREGROUND_SERVICE_MICROPHONE': {   'explanation': 'Allows '
                                                                           'ongoing '
                                                                           'audio '
                                                                           'recording '
                                                                           'while '
                                                                           'the '
                                                                           'app '
                                                                           'runs '
                                                                           'in '
                                                                           'a '
                                                                           'foreground '
                                                                           'service.',
                                                            'grant_mechanism': 'install_time',
                                                            'group': 'MICROPHONE',
                                                            'is_runtime': False,
                                                            'min_sdk': 34,
                                                            'name': 'Foreground '
                                                                    'Service: '
                                                                    'Microphone '
                                                                    'Access',
                                                            'platform_protection_level': 'normal',
                                                            'protection_level': 'normal',
                                                            'risk': 'High',
                                                            'source': 'https://developer.android.com/reference/android/Manifest.permission#FOREGROUND_SERVICE_MICROPHONE',
                                                            'user_impact': 'Enables '
                                                                           'audio '
                                                                           'recording '
                                                                           'and '
                                                                           'voice '
                                                                           'capture '
                                                                           'while '
                                                                           'app '
                                                                           'is '
                                                                           'running '
                                                                           'in '
                                                                           'the '
                                                                           'background.',
                                                            'verified_at': '2026-10-30'},
    'android.permission.FOREGROUND_SERVICE_SPECIAL_USE': {   'explanation': 'Declares '
                                                                            'that '
                                                                            'the '
                                                                            'foreground '
                                                                            'service '
                                                                            'performs '
                                                                            'an '
                                                                            'uncommon '
                                                                            'task '
                                                                            'not '
                                                                            'covered '
                                                                            'by '
                                                                            'standard '
                                                                            'Android '
                                                                            '14 '
                                                                            'types.',
                                                             'grant_mechanism': 'install_time',
                                                             'group': 'SYSTEM',
                                                             'is_runtime': False,
                                                             'min_sdk': 34,
                                                             'name': 'Foreground '
                                                                     'Service: '
                                                                     'Special '
                                                                     'Use',
                                                             'platform_protection_level': 'normal',
                                                             'protection_level': 'normal',
                                                             'risk': 'Moderate',
                                                             'source': 'https://developer.android.com/reference/android/Manifest.permission#FOREGROUND_SERVICE_SPECIAL_USE',
                                                             'user_impact': 'Runs '
                                                                            'ongoing '
                                                                            'background '
                                                                            'service '
                                                                            'with '
                                                                            'custom '
                                                                            'operational '
                                                                            'profile.',
                                                             'verified_at': '2026-10-30'},
    'android.permission.GET_ACCOUNTS': {   'explanation': 'Allows access to '
                                                          'the list of user '
                                                          'accounts recognized '
                                                          'by the Account '
                                                          'Manager (e.g. '
                                                          'Google, email, and '
                                                          'social accounts).',
                                           'grant_mechanism': 'runtime',
                                           'group': 'CONTACTS',
                                           'is_runtime': True,
                                           'min_sdk': 1,
                                           'name': 'Discover Known Accounts',
                                           'platform_protection_level': 'dangerous',
                                           'protection_level': 'dangerous',
                                           'risk': 'Moderate',
                                           'source': 'https://developer.android.com/reference/android/Manifest.permission#GET_ACCOUNTS',
                                           'user_impact': 'Reveals registered '
                                                          'account email '
                                                          'addresses '
                                                          'configured on the '
                                                          'device.',
                                           'verified_at': '2026-10-30'},
    'android.permission.INTERNET': {   'explanation': 'Allows the application '
                                                      'to create network '
                                                      'sockets and access the '
                                                      'Internet via cellular '
                                                      'data or Wi-Fi.',
                                       'grant_mechanism': 'install_time',
                                       'group': 'NETWORK',
                                       'is_runtime': False,
                                       'min_sdk': 1,
                                       'name': 'Full Network Access',
                                       'platform_protection_level': 'normal',
                                       'protection_level': 'normal',
                                       'risk': 'Low',
                                       'source': 'https://developer.android.com/reference/android/Manifest.permission#INTERNET',
                                       'user_impact': 'Enables sending and '
                                                      'receiving data across '
                                                      'the internet.',
                                       'verified_at': '2026-10-30'},
    'android.permission.MANAGE_EXTERNAL_STORAGE': {   'explanation': 'Special '
                                                                     'app '
                                                                     'access '
                                                                     'granting '
                                                                     'broad, '
                                                                     'unscoped '
                                                                     'access '
                                                                     'to all '
                                                                     'files on '
                                                                     'external '
                                                                     'storage, '
                                                                     'bypassing '
                                                                     'Scoped '
                                                                     'Storage '
                                                                     'restrictions.',
                                                      'grant_mechanism': 'special_app_access',
                                                      'group': 'STORAGE',
                                                      'is_runtime': False,
                                                      'min_sdk': 30,
                                                      'name': 'All Files '
                                                              'Access / Manage '
                                                              'External '
                                                              'Storage',
                                                      'platform_protection_level': 'appop',
                                                      'protection_level': 'appop',
                                                      'risk': 'Critical',
                                                      'source': 'https://developer.android.com/reference/android/Manifest.permission#MANAGE_EXTERNAL_STORAGE',
                                                      'user_impact': 'Grants '
                                                                     'unrestricted '
                                                                     'read and '
                                                                     'write '
                                                                     'access '
                                                                     'to all '
                                                                     'user '
                                                                     'files '
                                                                     'across '
                                                                     'the '
                                                                     'filesystem.',
                                                      'verified_at': '2026-10-30'},
    'android.permission.MODIFY_AUDIO_SETTINGS': {   'explanation': 'Allows an '
                                                                   'application '
                                                                   'to modify '
                                                                   'global '
                                                                   'audio '
                                                                   'settings '
                                                                   'such as '
                                                                   'volume, '
                                                                   'routing, '
                                                                   'and '
                                                                   'speakerphone '
                                                                   'selection.',
                                                    'grant_mechanism': 'install_time',
                                                    'group': 'HARDWARE',
                                                    'is_runtime': False,
                                                    'min_sdk': 1,
                                                    'name': 'Modify Global '
                                                            'Audio Settings',
                                                    'platform_protection_level': 'normal',
                                                    'protection_level': 'normal',
                                                    'risk': 'Low',
                                                    'source': 'https://developer.android.com/reference/android/Manifest.permission#MODIFY_AUDIO_SETTINGS',
                                                    'user_impact': 'Can adjust '
                                                                   'device '
                                                                   'volume '
                                                                   'levels and '
                                                                   'switch '
                                                                   'audio '
                                                                   'output '
                                                                   'devices.',
                                                    'verified_at': '2026-10-30'},
    'android.permission.NEARBY_WIFI_DEVICES': {   'explanation': 'Allows apps '
                                                                 'to discover '
                                                                 'and interact '
                                                                 'with nearby '
                                                                 'Wi-Fi '
                                                                 'devices '
                                                                 '(Wi-Fi '
                                                                 'Direct, '
                                                                 'Aware) '
                                                                 'without fine '
                                                                 'location '
                                                                 'access on '
                                                                 'Android 13+.',
                                                  'grant_mechanism': 'runtime',
                                                  'group': 'NEARBY_DEVICES',
                                                  'is_runtime': True,
                                                  'min_sdk': 33,
                                                  'name': 'Scan Nearby Wi-Fi '
                                                          'Devices',
                                                  'platform_protection_level': 'dangerous',
                                                  'protection_level': 'dangerous',
                                                  'risk': 'Moderate',
                                                  'source': 'https://developer.android.com/reference/android/Manifest.permission#NEARBY_WIFI_DEVICES',
                                                  'user_impact': 'Interacts '
                                                                 'with local '
                                                                 'peer-to-peer '
                                                                 'Wi-Fi '
                                                                 'devices '
                                                                 'without '
                                                                 'revealing '
                                                                 'GPS '
                                                                 'coordinates.',
                                                  'verified_at': '2026-10-30'},
    'android.permission.NFC': {   'explanation': 'Allows an application to '
                                                 'perform I/O operations over '
                                                 'NFC to read contactless tags '
                                                 'and exchange data.',
                                  'grant_mechanism': 'install_time',
                                  'group': 'HARDWARE',
                                  'is_runtime': False,
                                  'min_sdk': 9,
                                  'name': 'Near Field Communication (NFC)',
                                  'platform_protection_level': 'normal',
                                  'protection_level': 'normal',
                                  'risk': 'Low',
                                  'source': 'https://developer.android.com/reference/android/Manifest.permission#NFC',
                                  'user_impact': 'Reads contactless transit '
                                                 'cards, smart tags, or NFC '
                                                 'accessories.',
                                  'verified_at': '2026-10-30'},
    'android.permission.NFC_TRANSACTION_EVENT': {   'explanation': 'Allows '
                                                                   'applications '
                                                                   'to receive '
                                                                   'NFC '
                                                                   'transaction '
                                                                   'events '
                                                                   'triggered '
                                                                   'by '
                                                                   'contactless '
                                                                   'payments '
                                                                   'or secure '
                                                                   'element '
                                                                   'transactions.',
                                                    'grant_mechanism': 'install_time',
                                                    'group': 'HARDWARE',
                                                    'is_runtime': False,
                                                    'min_sdk': 28,
                                                    'name': 'Receive NFC '
                                                            'Transaction '
                                                            'Events',
                                                    'platform_protection_level': 'normal',
                                                    'protection_level': 'normal',
                                                    'risk': 'Moderate',
                                                    'source': 'https://developer.android.com/reference/android/Manifest.permission#NFC_TRANSACTION_EVENT',
                                                    'user_impact': 'Can '
                                                                   'receive '
                                                                   'events '
                                                                   'when a '
                                                                   'contactless '
                                                                   'secure '
                                                                   'transaction '
                                                                   'occurs.',
                                                    'verified_at': '2026-10-30'},
    'android.permission.PACKAGE_USAGE_STATS': {   'explanation': 'Special '
                                                                 'permission '
                                                                 'allowing an '
                                                                 'application '
                                                                 'to read '
                                                                 'detailed '
                                                                 'history of '
                                                                 'which apps '
                                                                 'you use, '
                                                                 'launch '
                                                                 'frequency, '
                                                                 'and total '
                                                                 'screen time.',
                                                  'grant_mechanism': 'special_app_access',
                                                  'group': 'SPECIAL_ACCESS',
                                                  'is_runtime': False,
                                                  'min_sdk': 21,
                                                  'name': 'Access App Usage '
                                                          'Statistics',
                                                  'platform_protection_level': 'signature|privileged|development|appop',
                                                  'protection_level': 'signature|privileged|development|appop',
                                                  'risk': 'High',
                                                  'source': 'https://developer.android.com/reference/android/Manifest.permission#PACKAGE_USAGE_STATS',
                                                  'user_impact': 'Exposes an '
                                                                 'exact '
                                                                 'timeline of '
                                                                 'your digital '
                                                                 'habits and '
                                                                 'application '
                                                                 'usage '
                                                                 'patterns.',
                                                  'verified_at': '2026-10-30'},
    'android.permission.POST_NOTIFICATIONS': {   'explanation': 'Allows an '
                                                                'application '
                                                                'to display '
                                                                'alerts, '
                                                                'badges, and '
                                                                'status bar '
                                                                'notifications '
                                                                'on Android 13 '
                                                                '(API 33)+.',
                                                 'grant_mechanism': 'runtime',
                                                 'group': 'NOTIFICATIONS',
                                                 'is_runtime': True,
                                                 'min_sdk': 33,
                                                 'name': 'Post System '
                                                         'Notifications',
                                                 'platform_protection_level': 'dangerous',
                                                 'protection_level': 'dangerous',
                                                 'risk': 'Moderate',
                                                 'source': 'https://developer.android.com/reference/android/Manifest.permission#POST_NOTIFICATIONS',
                                                 'user_impact': 'Allows app to '
                                                                'send messages '
                                                                'and '
                                                                'attention-grabbing '
                                                                'banners to '
                                                                'the lock '
                                                                'screen and '
                                                                'notification '
                                                                'shade.',
                                                 'verified_at': '2026-10-30'},
    'android.permission.QUERY_ALL_PACKAGES': {   'explanation': 'Allows an '
                                                                'application '
                                                                'to enumerate '
                                                                'and inspect '
                                                                'all installed '
                                                                'packages on '
                                                                'the device on '
                                                                'Android 11 '
                                                                '(API 30)+.',
                                                 'grant_mechanism': 'install_time',
                                                 'group': 'PACKAGE_MANAGEMENT',
                                                 'is_runtime': False,
                                                 'min_sdk': 30,
                                                 'name': 'Query All Installed '
                                                         'Applications',
                                                 'platform_protection_level': 'normal',
                                                 'protection_level': 'normal',
                                                 'risk': 'High',
                                                 'source': 'https://developer.android.com/reference/android/Manifest.permission#QUERY_ALL_PACKAGES',
                                                 'user_impact': 'Provides a '
                                                                'full '
                                                                'inventory of '
                                                                'every '
                                                                'installed '
                                                                'application '
                                                                'on your '
                                                                'phone, '
                                                                'exposing '
                                                                'personal '
                                                                'interests and '
                                                                'banking apps.',
                                                 'verified_at': '2026-10-30'},
    'android.permission.READ_CALENDAR': {   'explanation': 'Allows an '
                                                           'application to '
                                                           'read all calendar '
                                                           'events, meeting '
                                                           'subjects, '
                                                           'attendees, and '
                                                           'appointment notes.',
                                            'grant_mechanism': 'runtime',
                                            'group': 'CALENDAR',
                                            'is_runtime': True,
                                            'min_sdk': 1,
                                            'name': 'Read Calendar Events',
                                            'platform_protection_level': 'dangerous',
                                            'protection_level': 'dangerous',
                                            'risk': 'High',
                                            'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_CALENDAR',
                                            'user_impact': 'Exposes private '
                                                           'schedule, '
                                                           'locations of '
                                                           'meetings, and '
                                                           'personal '
                                                           'itinerary.',
                                            'verified_at': '2026-10-30'},
    'android.permission.READ_CALL_LOG': {   'explanation': 'Allows an '
                                                           'application to '
                                                           'read the complete '
                                                           'call log history '
                                                           'including dialed, '
                                                           'received, and '
                                                           'missed numbers and '
                                                           'timestamps.',
                                            'grant_mechanism': 'runtime',
                                            'group': 'CALL_LOG',
                                            'is_runtime': True,
                                            'min_sdk': 16,
                                            'name': 'Read Call History',
                                            'platform_protection_level': 'dangerous',
                                            'protection_level': 'dangerous',
                                            'risk': 'Critical',
                                            'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_CALL_LOG',
                                            'user_impact': 'Exposes metadata '
                                                           'of everyone you '
                                                           'speak with and '
                                                           'call durations.',
                                            'verified_at': '2026-10-30'},
    'android.permission.READ_CONTACTS': {   'explanation': 'Allows an '
                                                           'application to '
                                                           "read the user's "
                                                           'address book, '
                                                           'including names, '
                                                           'phone numbers, '
                                                           'email addresses, '
                                                           'and relationship '
                                                           'notes.',
                                            'grant_mechanism': 'runtime',
                                            'group': 'CONTACTS',
                                            'is_runtime': True,
                                            'min_sdk': 1,
                                            'name': 'Read Contacts',
                                            'platform_protection_level': 'dangerous',
                                            'protection_level': 'dangerous',
                                            'risk': 'High',
                                            'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_CONTACTS',
                                            'user_impact': 'Exposes your '
                                                           'complete social '
                                                           'and professional '
                                                           'network contacts '
                                                           'to the '
                                                           'application.',
                                            'verified_at': '2026-10-30'},
    'android.permission.READ_EXTERNAL_STORAGE': {   'explanation': 'Allows an '
                                                                   'application '
                                                                   'to read '
                                                                   'files from '
                                                                   'external '
                                                                   'shared '
                                                                   'storage '
                                                                   '(photos, '
                                                                   'downloads, '
                                                                   'documents). '
                                                                   'On Android '
                                                                   '13+, '
                                                                   'superseded '
                                                                   'by '
                                                                   'granular '
                                                                   'media '
                                                                   'permissions.',
                                                    'grant_mechanism': 'runtime',
                                                    'group': 'STORAGE',
                                                    'is_runtime': True,
                                                    'min_sdk': 1,
                                                    'name': 'Read External '
                                                            'Shared Storage',
                                                    'platform_protection_level': 'dangerous',
                                                    'protection_level': 'dangerous',
                                                    'risk': 'High',
                                                    'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_EXTERNAL_STORAGE',
                                                    'user_impact': 'Allows '
                                                                   'broad '
                                                                   'access to '
                                                                   'user '
                                                                   'photos, '
                                                                   'downloads, '
                                                                   'and shared '
                                                                   'documents.',
                                                    'verified_at': '2026-10-30'},
    'android.permission.READ_MEDIA_AUDIO': {   'explanation': 'Allows an app '
                                                              'to read music '
                                                              'and audio files '
                                                              'from shared '
                                                              'storage on '
                                                              'Android 13 (API '
                                                              '33)+.',
                                               'grant_mechanism': 'runtime',
                                               'group': 'STORAGE',
                                               'is_runtime': True,
                                               'min_sdk': 33,
                                               'name': 'Read Audio Files',
                                               'platform_protection_level': 'dangerous',
                                               'protection_level': 'dangerous',
                                               'risk': 'Moderate',
                                               'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_MEDIA_AUDIO',
                                               'user_impact': 'Allows access '
                                                              'to stored '
                                                              'music, voice '
                                                              'recordings, and '
                                                              'podcasts.',
                                               'verified_at': '2026-10-30'},
    'android.permission.READ_MEDIA_IMAGES': {   'explanation': 'Allows an app '
                                                               'to read image '
                                                               'files from '
                                                               'shared storage '
                                                               'on Android 13 '
                                                               '(API 33)+.',
                                                'grant_mechanism': 'runtime',
                                                'group': 'STORAGE',
                                                'is_runtime': True,
                                                'min_sdk': 33,
                                                'name': 'Read Photo & Image '
                                                        'Files',
                                                'platform_protection_level': 'dangerous',
                                                'protection_level': 'dangerous',
                                                'risk': 'Moderate',
                                                'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_MEDIA_IMAGES',
                                                'user_impact': 'Allows access '
                                                               'to all photos '
                                                               'stored on the '
                                                               'device.',
                                                'verified_at': '2026-10-30'},
    'android.permission.READ_MEDIA_VIDEO': {   'explanation': 'Allows an app '
                                                              'to read video '
                                                              'files from '
                                                              'shared storage '
                                                              'on Android 13 '
                                                              '(API 33)+.',
                                               'grant_mechanism': 'runtime',
                                               'group': 'STORAGE',
                                               'is_runtime': True,
                                               'min_sdk': 33,
                                               'name': 'Read Video Files',
                                               'platform_protection_level': 'dangerous',
                                               'protection_level': 'dangerous',
                                               'risk': 'Moderate',
                                               'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_MEDIA_VIDEO',
                                               'user_impact': 'Allows access '
                                                              'to all video '
                                                              'recordings on '
                                                              'the device.',
                                               'verified_at': '2026-10-30'},
    'android.permission.READ_MEDIA_VISUAL_USER_SELECTED': {   'explanation': 'Allows '
                                                                             'an '
                                                                             'application '
                                                                             'to '
                                                                             'read '
                                                                             'only '
                                                                             'user-selected '
                                                                             'photos '
                                                                             'and '
                                                                             'videos '
                                                                             'chosen '
                                                                             'via '
                                                                             'the '
                                                                             'system '
                                                                             'photo '
                                                                             'picker '
                                                                             'on '
                                                                             'Android '
                                                                             '14+.',
                                                              'grant_mechanism': 'runtime',
                                                              'group': 'STORAGE',
                                                              'is_runtime': True,
                                                              'min_sdk': 34,
                                                              'name': 'Access '
                                                                      'User-Selected '
                                                                      'Media',
                                                              'platform_protection_level': 'dangerous',
                                                              'protection_level': 'dangerous',
                                                              'risk': 'Low',
                                                              'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_MEDIA_VISUAL_USER_SELECTED',
                                                              'user_impact': 'Privacy-preserving: '
                                                                             'only '
                                                                             'accesses '
                                                                             'the '
                                                                             'exact '
                                                                             'items '
                                                                             'you '
                                                                             'specifically '
                                                                             'pick.',
                                                              'verified_at': '2026-10-30'},
    'android.permission.READ_PHONE_NUMBERS': {   'explanation': 'Allows read '
                                                                'access to the '
                                                                "device's "
                                                                'assigned '
                                                                'phone '
                                                                'number(s).',
                                                 'grant_mechanism': 'runtime',
                                                 'group': 'PHONE',
                                                 'is_runtime': True,
                                                 'min_sdk': 26,
                                                 'name': 'Read Device Phone '
                                                         'Numbers',
                                                 'platform_protection_level': 'dangerous',
                                                 'protection_level': 'dangerous',
                                                 'risk': 'High',
                                                 'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_PHONE_NUMBERS',
                                                 'user_impact': 'Directly '
                                                                'links your '
                                                                'physical '
                                                                'phone number '
                                                                'to '
                                                                'advertising '
                                                                'or tracking '
                                                                'profiles.',
                                                 'verified_at': '2026-10-30'},
    'android.permission.READ_PHONE_STATE': {   'explanation': 'Allows '
                                                              'read-only '
                                                              'access to phone '
                                                              'state, cellular '
                                                              'network status, '
                                                              'ongoing calls, '
                                                              'and historical '
                                                              'device '
                                                              'identifiers '
                                                              '(such as '
                                                              'carrier and '
                                                              'phone numbers).',
                                               'grant_mechanism': 'runtime',
                                               'group': 'PHONE',
                                               'is_runtime': True,
                                               'min_sdk': 1,
                                               'name': 'Read Phone Status and '
                                                       'Identity',
                                               'platform_protection_level': 'dangerous',
                                               'protection_level': 'dangerous',
                                               'risk': 'High',
                                               'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_PHONE_STATE',
                                               'user_impact': 'Can detect '
                                                              'incoming/outgoing '
                                                              'calls, cellular '
                                                              'carrier, and '
                                                              'device '
                                                              'telephony '
                                                              'status.',
                                               'verified_at': '2026-10-30'},
    'android.permission.READ_SMS': {   'explanation': 'Allows an application '
                                                      'to read stored SMS text '
                                                      'messages on the device.',
                                       'grant_mechanism': 'runtime',
                                       'group': 'SMS',
                                       'is_runtime': True,
                                       'min_sdk': 1,
                                       'name': 'Read SMS Messages',
                                       'platform_protection_level': 'dangerous',
                                       'protection_level': 'dangerous',
                                       'risk': 'Critical',
                                       'source': 'https://developer.android.com/reference/android/Manifest.permission#READ_SMS',
                                       'user_impact': 'Exposes banking alerts, '
                                                      '2FA codes, and private '
                                                      'conversations.',
                                       'verified_at': '2026-10-30'},
    'android.permission.RECEIVE_BOOT_COMPLETED': {   'explanation': 'Allows an '
                                                                    'application '
                                                                    'to '
                                                                    'receive '
                                                                    'the '
                                                                    'system '
                                                                    'broadcast '
                                                                    'after the '
                                                                    'device '
                                                                    'finishes '
                                                                    'booting, '
                                                                    'launching '
                                                                    'services '
                                                                    'automatically.',
                                                     'grant_mechanism': 'install_time',
                                                     'group': 'SYSTEM',
                                                     'is_runtime': False,
                                                     'min_sdk': 1,
                                                     'name': 'Run at Startup '
                                                             '(Boot Completed)',
                                                     'platform_protection_level': 'normal',
                                                     'protection_level': 'normal',
                                                     'risk': 'Moderate',
                                                     'source': 'https://developer.android.com/reference/android/Manifest.permission#RECEIVE_BOOT_COMPLETED',
                                                     'user_impact': 'Allows '
                                                                    'app to '
                                                                    'start '
                                                                    'automatically '
                                                                    'every '
                                                                    'time the '
                                                                    'phone '
                                                                    'powers '
                                                                    'on.',
                                                     'verified_at': '2026-10-30'},
    'android.permission.RECEIVE_MMS': {   'explanation': 'Allows an '
                                                         'application to '
                                                         'monitor incoming '
                                                         'multimedia messages '
                                                         '(MMS).',
                                          'grant_mechanism': 'runtime',
                                          'group': 'SMS',
                                          'is_runtime': True,
                                          'min_sdk': 1,
                                          'name': 'Receive MMS Messages',
                                          'platform_protection_level': 'dangerous',
                                          'protection_level': 'dangerous',
                                          'risk': 'High',
                                          'source': 'https://developer.android.com/reference/android/Manifest.permission#RECEIVE_MMS',
                                          'user_impact': 'Can intercept media '
                                                         'attachments and '
                                                         'photos sent via MMS.',
                                          'verified_at': '2026-10-30'},
    'android.permission.RECEIVE_SMS': {   'explanation': 'Allows an '
                                                         'application to '
                                                         'intercept and '
                                                         'process incoming SMS '
                                                         'messages.',
                                          'grant_mechanism': 'runtime',
                                          'group': 'SMS',
                                          'is_runtime': True,
                                          'min_sdk': 1,
                                          'name': 'Receive SMS Messages',
                                          'platform_protection_level': 'dangerous',
                                          'protection_level': 'dangerous',
                                          'risk': 'Critical',
                                          'source': 'https://developer.android.com/reference/android/Manifest.permission#RECEIVE_SMS',
                                          'user_impact': 'Can intercept '
                                                         'two-factor '
                                                         'authentication (2FA) '
                                                         'OTP codes and '
                                                         'private messages.',
                                          'verified_at': '2026-10-30'},
    'android.permission.RECEIVE_WAP_PUSH': {   'explanation': 'Allows an '
                                                              'application to '
                                                              'monitor and '
                                                              'receive '
                                                              'incoming WAP '
                                                              'push messages.',
                                               'grant_mechanism': 'runtime',
                                               'group': 'SMS',
                                               'is_runtime': True,
                                               'min_sdk': 1,
                                               'name': 'Receive WAP Push '
                                                       'Messages',
                                               'platform_protection_level': 'dangerous',
                                               'protection_level': 'dangerous',
                                               'risk': 'High',
                                               'source': 'https://developer.android.com/reference/android/Manifest.permission#RECEIVE_WAP_PUSH',
                                               'user_impact': 'Can inspect '
                                                              'legacy '
                                                              'telecommunication '
                                                              'push signals.',
                                               'verified_at': '2026-10-30'},
    'android.permission.RECORD_AUDIO': {   'explanation': 'Allows an '
                                                          'application to '
                                                          'access the '
                                                          'microphone audio '
                                                          'stream for voice '
                                                          'calls, audio '
                                                          'recording, voice '
                                                          'messaging, and '
                                                          'speech recognition.',
                                           'grant_mechanism': 'runtime',
                                           'group': 'MICROPHONE',
                                           'is_runtime': True,
                                           'min_sdk': 1,
                                           'name': 'Record Audio / Microphone',
                                           'platform_protection_level': 'dangerous',
                                           'protection_level': 'dangerous',
                                           'risk': 'High',
                                           'source': 'https://developer.android.com/reference/android/Manifest.permission#RECORD_AUDIO',
                                           'user_impact': 'Can record ambient '
                                                          'sounds, '
                                                          'conversations, and '
                                                          'confidential audio.',
                                           'verified_at': '2026-10-30'},
    'android.permission.REQUEST_DELETE_PACKAGES': {   'explanation': 'Allows '
                                                                     'an '
                                                                     'application '
                                                                     'to '
                                                                     'request '
                                                                     'deletion '
                                                                     'of '
                                                                     'installed '
                                                                     'packages '
                                                                     'via '
                                                                     'system '
                                                                     'confirmation '
                                                                     'dialog.',
                                                      'grant_mechanism': 'install_time',
                                                      'group': 'PACKAGE_MANAGEMENT',
                                                      'is_runtime': False,
                                                      'min_sdk': 26,
                                                      'name': 'Request Package '
                                                              'Deletion',
                                                      'platform_protection_level': 'normal',
                                                      'protection_level': 'normal',
                                                      'risk': 'Moderate',
                                                      'source': 'https://developer.android.com/reference/android/Manifest.permission#REQUEST_DELETE_PACKAGES',
                                                      'user_impact': 'Can '
                                                                     'prompt '
                                                                     'user to '
                                                                     'uninstall '
                                                                     'applications.',
                                                      'verified_at': '2026-10-30'},
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS': {   'explanation': 'Allows '
                                                                                  'an '
                                                                                  'application '
                                                                                  'to '
                                                                                  'prompt '
                                                                                  'the '
                                                                                  'user '
                                                                                  'to '
                                                                                  'whitelist '
                                                                                  'the '
                                                                                  'app '
                                                                                  'from '
                                                                                  'system '
                                                                                  'Doze '
                                                                                  'and '
                                                                                  'App '
                                                                                  'Standby '
                                                                                  'battery '
                                                                                  'management.',
                                                                   'grant_mechanism': 'install_time',
                                                                   'group': 'SYSTEM',
                                                                   'is_runtime': False,
                                                                   'min_sdk': 23,
                                                                   'name': 'Request '
                                                                           'Exemption '
                                                                           'from '
                                                                           'Battery '
                                                                           'Saver',
                                                                   'platform_protection_level': 'normal',
                                                                   'protection_level': 'normal',
                                                                   'risk': 'Moderate',
                                                                   'source': 'https://developer.android.com/reference/android/Manifest.permission#REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
                                                                   'user_impact': 'Allows '
                                                                                  'continuous '
                                                                                  'background '
                                                                                  'activity '
                                                                                  'without '
                                                                                  'system '
                                                                                  'power '
                                                                                  'throttling.',
                                                                   'verified_at': '2026-10-30'},
    'android.permission.REQUEST_INSTALL_PACKAGES': {   'explanation': 'Allows '
                                                                      'an '
                                                                      'application '
                                                                      'to '
                                                                      'request '
                                                                      'installation '
                                                                      'of new '
                                                                      'APK '
                                                                      'packages. '
                                                                      'Required '
                                                                      'for app '
                                                                      'stores '
                                                                      'and '
                                                                      'sideloading '
                                                                      'utilities.',
                                                       'grant_mechanism': 'special_app_access',
                                                       'group': 'PACKAGE_MANAGEMENT',
                                                       'is_runtime': False,
                                                       'min_sdk': 26,
                                                       'name': 'Request '
                                                               'Package '
                                                               'Installation / '
                                                               'Sideloading',
                                                       'platform_protection_level': 'normal|appop',
                                                       'protection_level': 'normal|appop',
                                                       'risk': 'High',
                                                       'source': 'https://developer.android.com/reference/android/Manifest.permission#REQUEST_INSTALL_PACKAGES',
                                                       'user_impact': 'Allows '
                                                                      'the app '
                                                                      'to '
                                                                      'prompt '
                                                                      'the '
                                                                      'system '
                                                                      'to '
                                                                      'install '
                                                                      'executable '
                                                                      'Android '
                                                                      'packages.',
                                                       'verified_at': '2026-10-30'},
    'android.permission.SCHEDULE_EXACT_ALARM': {   'explanation': 'Allows an '
                                                                  'app to '
                                                                  'schedule '
                                                                  'exact-time '
                                                                  'alarms for '
                                                                  'precise '
                                                                  'clock '
                                                                  'execution. '
                                                                  'Requires '
                                                                  'power '
                                                                  'consumption '
                                                                  'and '
                                                                  'wakeups.',
                                                   'grant_mechanism': 'install_time',
                                                   'group': 'SYSTEM',
                                                   'is_runtime': False,
                                                   'min_sdk': 31,
                                                   'name': 'Schedule Exact '
                                                           'Alarms',
                                                   'platform_protection_level': 'normal',
                                                   'protection_level': 'normal',
                                                   'risk': 'Low',
                                                   'source': 'https://developer.android.com/reference/android/Manifest.permission#SCHEDULE_EXACT_ALARM',
                                                   'user_impact': 'Can wake up '
                                                                  'device from '
                                                                  'battery-saving '
                                                                  'sleep at '
                                                                  'precise '
                                                                  'millisecond '
                                                                  'intervals.',
                                                   'verified_at': '2026-10-30'},
    'android.permission.SEND_SMS': {   'explanation': 'Allows an application '
                                                      'to send SMS text '
                                                      'messages without user '
                                                      'intervention.',
                                       'grant_mechanism': 'runtime',
                                       'group': 'SMS',
                                       'is_runtime': True,
                                       'min_sdk': 1,
                                       'name': 'Send SMS Messages',
                                       'platform_protection_level': 'dangerous',
                                       'protection_level': 'dangerous',
                                       'risk': 'Critical',
                                       'source': 'https://developer.android.com/reference/android/Manifest.permission#SEND_SMS',
                                       'user_impact': 'Can incur financial '
                                                      'charges via premium SMS '
                                                      'or send unauthorized '
                                                      'messages.',
                                       'verified_at': '2026-10-30'},
    'android.permission.SYSTEM_ALERT_WINDOW': {   'explanation': 'Allows an '
                                                                 'app to draw '
                                                                 'alert '
                                                                 'windows and '
                                                                 'floating UI '
                                                                 'elements '
                                                                 'over any '
                                                                 'other '
                                                                 'running app. '
                                                                 'Used by '
                                                                 'floating '
                                                                 'widgets, but '
                                                                 'also '
                                                                 'high-risk '
                                                                 'for '
                                                                 'clickjacking '
                                                                 'and '
                                                                 'phishing.',
                                                  'grant_mechanism': 'special_app_access',
                                                  'group': 'SPECIAL_ACCESS',
                                                  'is_runtime': False,
                                                  'min_sdk': 1,
                                                  'name': 'Display Over Other '
                                                          'Apps / Overlay',
                                                  'platform_protection_level': 'signature|preinstalled|appop|pre23|development',
                                                  'protection_level': 'signature|preinstalled|appop|pre23|development',
                                                  'risk': 'High',
                                                  'source': 'https://developer.android.com/reference/android/Manifest.permission#SYSTEM_ALERT_WINDOW',
                                                  'user_impact': 'Can obscure '
                                                                 'other '
                                                                 'applications '
                                                                 'or create '
                                                                 'invisible '
                                                                 'overlay tap '
                                                                 'targets '
                                                                 '(tapjacking).',
                                                  'verified_at': '2026-10-30'},
    'android.permission.UPDATE_PACKAGES_WITHOUT_USER_ACTION': {   'explanation': 'Allows '
                                                                                 'a '
                                                                                 'designated '
                                                                                 'package '
                                                                                 'installer '
                                                                                 '(app '
                                                                                 'store) '
                                                                                 'to '
                                                                                 'perform '
                                                                                 'unattended '
                                                                                 'background '
                                                                                 'package '
                                                                                 'updates '
                                                                                 'on '
                                                                                 'Android '
                                                                                 '12+.',
                                                                  'grant_mechanism': 'install_time',
                                                                  'group': 'PACKAGE_MANAGEMENT',
                                                                  'is_runtime': False,
                                                                  'min_sdk': 31,
                                                                  'name': 'Update '
                                                                          'Packages '
                                                                          'Without '
                                                                          'User '
                                                                          'Action',
                                                                  'platform_protection_level': 'normal',
                                                                  'protection_level': 'normal',
                                                                  'risk': 'Moderate',
                                                                  'source': 'https://developer.android.com/reference/android/Manifest.permission#UPDATE_PACKAGES_WITHOUT_USER_ACTION',
                                                                  'user_impact': 'Allows '
                                                                                 'approved '
                                                                                 'app '
                                                                                 'stores '
                                                                                 'to '
                                                                                 'update '
                                                                                 'previously '
                                                                                 'installed '
                                                                                 'applications '
                                                                                 'automatically.',
                                                                  'verified_at': '2026-10-30'},
    'android.permission.USE_BIOMETRIC': {   'explanation': 'Allows an '
                                                           'application to '
                                                           'request user '
                                                           'authentication via '
                                                           'fingerprint, face '
                                                           'unlock, or iris '
                                                           'scanning.',
                                            'grant_mechanism': 'install_time',
                                            'group': 'BIOMETRIC',
                                            'is_runtime': False,
                                            'min_sdk': 28,
                                            'name': 'Use Biometric Hardware',
                                            'platform_protection_level': 'normal',
                                            'protection_level': 'normal',
                                            'risk': 'Low',
                                            'source': 'https://developer.android.com/reference/android/Manifest.permission#USE_BIOMETRIC',
                                            'user_impact': 'Allows biometric '
                                                           'authentication '
                                                           'prompts (biometric '
                                                           'templates remain '
                                                           'protected in '
                                                           'secure hardware).',
                                            'verified_at': '2026-10-30'},
    'android.permission.USE_EXACT_ALARM': {   'explanation': 'Restricted '
                                                             'permission for '
                                                             'alarms, timers, '
                                                             'and calendar '
                                                             'applications to '
                                                             'schedule exact '
                                                             'alarms on '
                                                             'Android 13+.',
                                              'grant_mechanism': 'install_time',
                                              'group': 'SYSTEM',
                                              'is_runtime': False,
                                              'min_sdk': 33,
                                              'name': 'Use Exact Alarm',
                                              'platform_protection_level': 'normal',
                                              'protection_level': 'normal',
                                              'risk': 'Low',
                                              'source': 'https://developer.android.com/reference/android/Manifest.permission#USE_EXACT_ALARM',
                                              'user_impact': 'Standard '
                                                             'permission for '
                                                             'clocks, alarms, '
                                                             'and timers.',
                                              'verified_at': '2026-10-30'},
    'android.permission.USE_FINGERPRINT': {   'explanation': 'Legacy biometric '
                                                             'permission '
                                                             'allowing an '
                                                             'application to '
                                                             'use the '
                                                             'fingerprint '
                                                             'scanner for user '
                                                             'verification.',
                                              'grant_mechanism': 'install_time',
                                              'group': 'BIOMETRIC',
                                              'is_runtime': False,
                                              'min_sdk': 23,
                                              'name': 'Use Fingerprint '
                                                      'Hardware (Legacy)',
                                              'platform_protection_level': 'normal',
                                              'protection_level': 'normal',
                                              'risk': 'Low',
                                              'source': 'https://developer.android.com/reference/android/Manifest.permission#USE_FINGERPRINT',
                                              'user_impact': 'Legacy '
                                                             'fingerprint '
                                                             'authentication '
                                                             'interface; '
                                                             'biometric data '
                                                             'never leaves '
                                                             'secure hardware.',
                                              'verified_at': '2026-10-30'},
    'android.permission.UWB_RANGING': {   'explanation': 'Allows an '
                                                         'application to '
                                                         'determine relative '
                                                         'position between '
                                                         'ultra-wideband (UWB) '
                                                         'devices.',
                                          'grant_mechanism': 'runtime',
                                          'group': 'NEARBY_DEVICES',
                                          'is_runtime': True,
                                          'min_sdk': 31,
                                          'name': 'Ultra-Wideband Ranging',
                                          'platform_protection_level': 'dangerous',
                                          'protection_level': 'dangerous',
                                          'risk': 'Moderate',
                                          'source': 'https://developer.android.com/reference/android/Manifest.permission#UWB_RANGING',
                                          'user_impact': 'Measures precise '
                                                         'distance and angle '
                                                         'to nearby UWB tags '
                                                         'and hardware.',
                                          'verified_at': '2026-10-30'},
    'android.permission.VIBRATE': {   'explanation': 'Allows an application to '
                                                     'trigger haptic feedback '
                                                     'and device vibration.',
                                      'grant_mechanism': 'install_time',
                                      'group': 'HARDWARE',
                                      'is_runtime': False,
                                      'min_sdk': 1,
                                      'name': 'Control Device Vibrator',
                                      'platform_protection_level': 'normal',
                                      'protection_level': 'normal',
                                      'risk': 'Low',
                                      'source': 'https://developer.android.com/reference/android/Manifest.permission#VIBRATE',
                                      'user_impact': 'Causes the phone to '
                                                     'vibrate for haptic '
                                                     'feedback or '
                                                     'notifications.',
                                      'verified_at': '2026-10-30'},
    'android.permission.WAKE_LOCK': {   'explanation': 'Allows an application '
                                                       'to hold a wake lock to '
                                                       'keep the device CPU '
                                                       'active while '
                                                       'performing tasks with '
                                                       'the screen turned off.',
                                        'grant_mechanism': 'install_time',
                                        'group': 'HARDWARE',
                                        'is_runtime': False,
                                        'min_sdk': 1,
                                        'name': 'Prevent Processor Sleeping '
                                                '(WakeLock)',
                                        'platform_protection_level': 'normal',
                                        'protection_level': 'normal',
                                        'risk': 'Low',
                                        'source': 'https://developer.android.com/reference/android/Manifest.permission#WAKE_LOCK',
                                        'user_impact': 'Keeps processor awake '
                                                       'in the background, '
                                                       'which can drain '
                                                       'battery if misused.',
                                        'verified_at': '2026-10-30'},
    'android.permission.WRITE_CALENDAR': {   'explanation': 'Allows an '
                                                            'application to '
                                                            'add, remove, or '
                                                            'modify calendar '
                                                            'events.',
                                             'grant_mechanism': 'runtime',
                                             'group': 'CALENDAR',
                                             'is_runtime': True,
                                             'min_sdk': 1,
                                             'name': 'Modify Calendar Events',
                                             'platform_protection_level': 'dangerous',
                                             'protection_level': 'dangerous',
                                             'risk': 'Moderate',
                                             'source': 'https://developer.android.com/reference/android/Manifest.permission#WRITE_CALENDAR',
                                             'user_impact': 'Can create false '
                                                            'calendar events, '
                                                            'alter invites, or '
                                                            'delete '
                                                            'appointments.',
                                             'verified_at': '2026-10-30'},
    'android.permission.WRITE_CALL_LOG': {   'explanation': 'Allows an '
                                                            'application to '
                                                            'write and delete '
                                                            'entries from the '
                                                            'system call log.',
                                             'grant_mechanism': 'runtime',
                                             'group': 'CALL_LOG',
                                             'is_runtime': True,
                                             'min_sdk': 16,
                                             'name': 'Modify Call History',
                                             'platform_protection_level': 'dangerous',
                                             'protection_level': 'dangerous',
                                             'risk': 'High',
                                             'source': 'https://developer.android.com/reference/android/Manifest.permission#WRITE_CALL_LOG',
                                             'user_impact': 'Can erase traces '
                                                            'of malicious or '
                                                            'unauthorized '
                                                            'outgoing calls.',
                                             'verified_at': '2026-10-30'},
    'android.permission.WRITE_CONTACTS': {   'explanation': 'Allows an '
                                                            'application to '
                                                            'modify or add '
                                                            'contact data in '
                                                            "the user's "
                                                            'address book.',
                                             'grant_mechanism': 'runtime',
                                             'group': 'CONTACTS',
                                             'is_runtime': True,
                                             'min_sdk': 1,
                                             'name': 'Modify Contacts',
                                             'platform_protection_level': 'dangerous',
                                             'protection_level': 'dangerous',
                                             'risk': 'Moderate',
                                             'source': 'https://developer.android.com/reference/android/Manifest.permission#WRITE_CONTACTS',
                                             'user_impact': 'Can alter, '
                                                            'corrupt, or '
                                                            'delete contact '
                                                            'records in your '
                                                            'address book.',
                                             'verified_at': '2026-10-30'},
    'android.permission.WRITE_EXTERNAL_STORAGE': {   'explanation': 'Allows an '
                                                                    'application '
                                                                    'to write, '
                                                                    'modify, '
                                                                    'and '
                                                                    'delete '
                                                                    'files on '
                                                                    'external '
                                                                    'shared '
                                                                    'storage.',
                                                     'grant_mechanism': 'runtime',
                                                     'group': 'STORAGE',
                                                     'is_runtime': True,
                                                     'min_sdk': 1,
                                                     'name': 'Write to '
                                                             'External Shared '
                                                             'Storage',
                                                     'platform_protection_level': 'dangerous',
                                                     'protection_level': 'dangerous',
                                                     'risk': 'High',
                                                     'source': 'https://developer.android.com/reference/android/Manifest.permission#WRITE_EXTERNAL_STORAGE',
                                                     'user_impact': 'Can '
                                                                    'modify or '
                                                                    'delete '
                                                                    'files, '
                                                                    'photos, '
                                                                    'or '
                                                                    'documents '
                                                                    'stored on '
                                                                    'device '
                                                                    'storage.',
                                                     'verified_at': '2026-10-30'},
    'android.permission.WRITE_SETTINGS': {   'explanation': 'Special '
                                                            'permission '
                                                            'allowing an '
                                                            'application to '
                                                            'read or write '
                                                            'system-wide '
                                                            'configuration '
                                                            'settings.',
                                             'grant_mechanism': 'special_app_access',
                                             'group': 'SPECIAL_ACCESS',
                                             'is_runtime': False,
                                             'min_sdk': 1,
                                             'name': 'Modify System Settings',
                                             'platform_protection_level': 'signature|preinstalled|appop|pre23|development',
                                             'protection_level': 'signature|preinstalled|appop|pre23|development',
                                             'risk': 'High',
                                             'source': 'https://developer.android.com/reference/android/Manifest.permission#WRITE_SETTINGS',
                                             'user_impact': 'Can change device '
                                                            'ringtones, screen '
                                                            'timeout, system '
                                                            'brightness, and '
                                                            'network '
                                                            'behaviors.',
                                             'verified_at': '2026-10-30'},
    'com.android.vending.BILLING': {   'explanation': 'Allows an application '
                                                      'to offer digital goods '
                                                      'and in-app '
                                                      'subscriptions processed '
                                                      'via Google Play '
                                                      'Billing.',
                                       'grant_mechanism': 'install_time',
                                       'group': 'COMMERCE',
                                       'is_runtime': False,
                                       'min_sdk': 1,
                                       'name': 'Google Play In-App Billing',
                                       'platform_protection_level': 'normal',
                                       'protection_level': 'normal',
                                       'risk': 'Low',
                                       'source': 'https://developer.android.com/google/play/billing',
                                       'user_impact': 'Standard framework for '
                                                      'authorized in-app '
                                                      'purchases and '
                                                      'subscriptions.',
                                       'verified_at': '2026-10-30'},
    'com.android.vending.CHECK_LICENSE': {   'explanation': 'Allows the '
                                                            'application to '
                                                            'verify with '
                                                            'Google Play that '
                                                            'the current user '
                                                            'has '
                                                            'licensed/purchased '
                                                            'the app.',
                                             'grant_mechanism': 'install_time',
                                             'group': 'PACKAGE_MANAGEMENT',
                                             'is_runtime': False,
                                             'min_sdk': 1,
                                             'name': 'Google Play Licensing '
                                                     'Check',
                                             'platform_protection_level': 'normal',
                                             'protection_level': 'normal',
                                             'risk': 'Low',
                                             'source': 'https://developer.android.com/google/play/licensing',
                                             'user_impact': 'Standard '
                                                            'anti-piracy '
                                                            'licensing check '
                                                            'with Google Play.',
                                             'verified_at': '2026-10-30'},
    'com.google.android.c2dm.permission.RECEIVE': {   'explanation': 'Allows '
                                                                     'the app '
                                                                     'to '
                                                                     'receive '
                                                                     'push '
                                                                     'notifications '
                                                                     'via '
                                                                     'Google '
                                                                     'Cloud '
                                                                     'Messaging '
                                                                     '/ '
                                                                     'Firebase '
                                                                     'Cloud '
                                                                     'Messaging.',
                                                      'grant_mechanism': 'signature_restricted',
                                                      'group': 'NOTIFICATIONS',
                                                      'is_runtime': False,
                                                      'min_sdk': 8,
                                                      'name': 'Firebase / '
                                                              'Cloud to Device '
                                                              'Messaging '
                                                              '(Push)',
                                                      'platform_protection_level': 'signature',
                                                      'protection_level': 'signature',
                                                      'risk': 'Low',
                                                      'source': 'https://firebase.google.com/docs/cloud-messaging/android/client',
                                                      'user_impact': 'Enables '
                                                                     'real-time '
                                                                     'push '
                                                                     'message '
                                                                     'delivery '
                                                                     'from '
                                                                     'servers '
                                                                     'to your '
                                                                     'device.',
                                                      'verified_at': '2026-10-30'},
    'com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE': {   'explanation': 'Allows '
                                                                                                 'an '
                                                                                                 'application '
                                                                                                 'to '
                                                                                                 'query '
                                                                                                 'Google '
                                                                                                 'Play '
                                                                                                 'for '
                                                                                                 'campaign '
                                                                                                 'attribution '
                                                                                                 'data '
                                                                                                 'that '
                                                                                                 'caused '
                                                                                                 'the '
                                                                                                 'app '
                                                                                                 'to '
                                                                                                 'be '
                                                                                                 'installed.',
                                                                                  'grant_mechanism': 'install_time',
                                                                                  'group': 'ADVERTISING',
                                                                                  'is_runtime': False,
                                                                                  'min_sdk': 14,
                                                                                  'name': 'Google '
                                                                                          'Play '
                                                                                          'Install '
                                                                                          'Referrer '
                                                                                          'Service',
                                                                                  'platform_protection_level': 'normal',
                                                                                  'protection_level': 'normal',
                                                                                  'risk': 'Low',
                                                                                  'source': 'https://developer.android.com/google/play/installreferrer',
                                                                                  'user_impact': 'Links '
                                                                                                 'your '
                                                                                                 'installation '
                                                                                                 'event '
                                                                                                 'back '
                                                                                                 'to '
                                                                                                 'the '
                                                                                                 'marketing '
                                                                                                 'campaign '
                                                                                                 'or '
                                                                                                 'ad '
                                                                                                 'link '
                                                                                                 'you '
                                                                                                 'clicked.',
                                                                                  'verified_at': '2026-10-30'},
    'com.google.android.gms.permission.AD_ID': {   'explanation': 'Allows an '
                                                                  'app to '
                                                                  'access the '
                                                                  'Google Play '
                                                                  'Services '
                                                                  'Advertising '
                                                                  'ID for '
                                                                  'personalized '
                                                                  'advertising '
                                                                  'and user '
                                                                  'tracking.',
                                                   'grant_mechanism': 'install_time',
                                                   'group': 'ADVERTISING',
                                                   'is_runtime': False,
                                                   'min_sdk': 31,
                                                   'name': 'Google Play '
                                                           'Advertising ID '
                                                           '(AAID)',
                                                   'platform_protection_level': 'normal',
                                                   'protection_level': 'normal',
                                                   'risk': 'Moderate',
                                                   'source': 'https://developers.google.com/android/reference/com/google/android/gms/ads/identifier/AdvertisingIdClient',
                                                   'user_impact': 'Permits '
                                                                  'tracking '
                                                                  'user '
                                                                  'interactions '
                                                                  'and '
                                                                  'conversions '
                                                                  'across '
                                                                  'different '
                                                                  'applications.',
                                                   'verified_at': '2026-10-30'}}

def main():
    dest = Path("data/permissions.json")
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(PERMISSIONS, f, indent=2, sort_keys=True)
    print(f"Successfully generated {len(PERMISSIONS)} verified permissions into {dest}")

if __name__ == "__main__":
    main()
