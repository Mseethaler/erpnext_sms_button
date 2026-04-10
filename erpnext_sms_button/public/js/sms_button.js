function get_phone(frm) {
    const dt = frm.doc.doctype;
    if (dt === 'Lead' || dt === 'Contact') {
        return frm.doc.mobile_no || frm.doc.phone || '';
    } else if (dt === 'Customer') {
        return frm.doc.mobile_no || '';
    } else if (dt === 'Sales Order') {
        return frm.doc.contact_mobile || frm.doc.contact_phone || '';
    } else if (dt === 'Sales Invoice') {
        return frm.doc.contact_mobile || frm.doc.customer_phone_number || '';
    } else if (dt === 'Opportunity') {
        return frm.doc.contact_mobile || frm.doc.phone || '';
    }
    return '';
}

function show_sms_dialog(frm) {
    const phone = get_phone(frm);

    const default_msg = frm.doc.doctype === 'Sales Invoice'
        ? `Invoice ${frm.doc.name} — Due: $${frm.doc.grand_total} by ${frm.doc.due_date}`
        : `Message from ${frappe.boot.sysdefaults.company}`;

    let d = new frappe.ui.Dialog({
        title: __('Send SMS'),
        fields: [
            {
                fieldname: 'mobile_no',
                fieldtype: 'Data',
                label: __('Mobile Number'),
                default: phone,
                reqd: 1
            },
            {
                fieldname: 'message',
                fieldtype: 'Small Text',
                label: __('Message'),
                default: default_msg,
                reqd: 1
            }
        ],
        primary_action_label: __('Send'),
        primary_action(values) {
            frappe.call({
                method: 'frappe.core.doctype.sms_settings.sms_settings.send_sms',
                args: {
                    receiver_list: [values.mobile_no],
                    msg: values.message
                },
                callback(r) {
                    if (!r.exc) {
                        frappe.show_alert({ message: __('SMS Sent'), indicator: 'green' });
                        frappe.call({
                            method: 'frappe.client.insert',
                            args: {
                                doc: {
                                    doctype: 'Communication',
                                    communication_type: 'Communication',
                                    communication_medium: 'SMS',
                                    reference_doctype: frm.doc.doctype,
                                    reference_name: frm.doc.name,
                                    content: values.message,
                                    sent_or_received: 'Sent',
                                    phone_no: values.mobile_no
                                }
                            }
                        });
                        d.hide();
                    }
                }
            });
        }
    });
    d.show();
}

function show_call_dialog(frm) {
    const phone = get_phone(frm);

    if (!phone) {
        frappe.msgprint(__('No phone number found on this record.'));
        return;
    }

    // Open the tel: link immediately
    window.location.href = `tel:${phone}`;

    // Show the post-call logging dialog
    let d = new frappe.ui.Dialog({
        title: __('Log Call'),
        fields: [
            {
                fieldname: 'phone_no',
                fieldtype: 'Data',
                label: __('Phone Number'),
                default: phone,
                reqd: 1
            },
            {
                fieldname: 'outcome',
                fieldtype: 'Select',
                label: __('Outcome'),
                options: [
                    'Reached',
                    'No Answer',
                    'Left Voicemail',
                    'Wrong Number',
                    'Call Back Later'
                ].join('\n'),
                default: 'Reached',
                reqd: 1
            },
            {
                fieldname: 'summary',
                fieldtype: 'Small Text',
                label: __('Summary / Notes'),
            }
        ],
        primary_action_label: __('Log Call'),
        secondary_action_label: __('Skip'),
        primary_action(values) {
            const content = `Call ${values.outcome}${values.summary ? ' — ' + values.summary : ''}`;
            frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Communication',
                        communication_type: 'Communication',
                        communication_medium: 'Phone',
                        reference_doctype: frm.doc.doctype,
                        reference_name: frm.doc.name,
                        content: content,
                        sent_or_received: 'Sent',
                        phone_no: values.phone_no,
                        subject: `Call — ${values.outcome}`
                    }
                },
                callback(r) {
                    if (!r.exc) {
                        frappe.show_alert({ message: __('Call Logged'), indicator: 'green' });
                        frm.reload_doc();
                    }
                }
            });
            d.hide();
        },
        secondary_action() {
            d.hide();
        }
    });
    d.show();
}

['Sales Invoice', 'Sales Order', 'Lead', 'Contact', 'Customer', 'Opportunity'].forEach(dt => {
    frappe.ui.form.on(dt, {
        refresh(frm) {
            frm.page.add_menu_item(__('Send SMS'), () => show_sms_dialog(frm));
            frm.page.add_menu_item(__('Call'), () => show_call_dialog(frm));
        }
    });
});
