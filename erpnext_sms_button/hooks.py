app_name = "erpnext_sms_button"
app_title = "ERPNext SMS Button"
app_publisher = "Mseethaler"
app_description = "Adds Send SMS button to key doctypes using native SMS settings"
app_version = "0.0.1"

doctype_js = {
    "Sales Invoice"  : "public/js/sms_button.js",
    "Sales Order"    : "public/js/sms_button.js",
    "Lead"           : "public/js/sms_button.js",
    "Contact"        : "public/js/sms_button.js",
    "Customer"       : "public/js/sms_button.js",
    "Opportunity"    : "public/js/sms_button.js",
}
