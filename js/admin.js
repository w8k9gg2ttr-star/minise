/* Minise Arte admin console.
   Runs from the website folder on your computer, behind a password.
   - Products and shop settings are saved into js/products.js and js/settings.js
     (Chrome/Edge write into the folder after "Connect folder"; other browsers download the two files).
   - Orders live in this browser (localStorage) with a backup in admin-data/orders.json when the folder is connected. */
(function () {
  "use strict";

  var T = window.MINISE_T || {};
  /* ---------- interface text [English, Lao] ---------- */
  var AT = {
    brand_sub: ["Admin console", "ຈັດການຮ້ານ"],
    view_shop: ["View shop", "ເບິ່ງໜ້າຮ້ານ"],
    logout: ["Log out", "ອອກຈາກລະບົບ"],
    lang_switch: ["ພາສາລາວ", "English"],
    connect: ["Connect folder", "ເຊື່ອມໂຟນເດີ"],
    reconnect: ["Reconnect folder", "ເຊື່ອມໂຟນເດີອີກຄັ້ງ"],
    connected: ["Saving to: {n}", "ບັນທຶກລົງ: {n}"],
    not_connected: ["Not connected: Save downloads files", "ຍັງບໍ່ເຊື່ອມ: ບັນທຶກຈະດາວໂຫຼດໄຟລ໌"],
    save: ["Save changes", "ບັນທຶກ"],
    save_n: ["Save {n} change(s)", "ບັນທຶກ {n} ການປ່ຽນແປງ"],
    saved_all: ["All changes saved", "ບັນທຶກແລ້ວທັງໝົດ"],
    saved: ["Saved. Refresh the shop to see your changes.", "ບັນທຶກແລ້ວ. ໂຫຼດໜ້າຮ້ານໃໝ່ເພື່ອເບິ່ງການປ່ຽນແປງ"],
    saved_dl: ["Downloaded products.js and settings.js. Move both into the js folder of your website, replacing the old files.", "ດາວໂຫຼດ products.js ແລະ settings.js ແລ້ວ. ຍ້າຍທັງສອງໄຟລ໌ໄປໃສ່ໂຟນເດີ js ແທນໄຟລ໌ເກົ່າ"],
    no_fs: ["This browser can't save into folders. Open admin.html in Chrome or Edge to save directly, or use Save to download the files.", "ບຣາວເຊີນີ້ບັນທຶກລົງໂຟນເດີບໍ່ໄດ້. ເປີດ admin.html ໃນ Chrome ຫຼື Edge ຫຼື ກົດບັນທຶກເພື່ອດາວໂຫຼດໄຟລ໌"],
    wrong_folder: ["That folder isn't the website folder. Choose the folder that contains index.html and the js folder.", "ໂຟນເດີນີ້ບໍ່ແມ່ນໂຟນເດີເວັບໄຊ. ເລືອກໂຟນເດີທີ່ມີ index.html ແລະ ໂຟນເດີ js"],
    save_fail: ["Couldn't save to the folder: {e}. Your changes are still here; try again or reconnect the folder.", "ບັນທຶກລົງໂຟນເດີບໍ່ໄດ້: {e}. ການປ່ຽນແປງຍັງຢູ່; ລອງໃໝ່ ຫຼື ເຊື່ອມໂຟນເດີອີກຄັ້ງ"],
    leave_warn: ["You have unsaved changes.", "ທ່ານມີການປ່ຽນແປງທີ່ຍັງບໍ່ໄດ້ບັນທຶກ"],
    search_ph: ["Search orders, customers, products", "ຄົ້ນຫາ ອໍເດີ ລູກຄ້າ ສິນຄ້າ"],
    g_none: ["Nothing found for “{q}”.", "ບໍ່ພົບ “{q}”"],
    grp_sales: ["Sales", "ການຂາຍ"],
    grp_catalog: ["Catalogue", "ສິນຄ້າ"],
    grp_settings: ["Settings", "ຕັ້ງຄ່າ"],
    nav_dashboard: ["Dashboard", "ພາບລວມ"],
    nav_orders: ["Orders", "ອໍເດີ"],
    nav_customers: ["Customers", "ລູກຄ້າ"],
    nav_products: ["Products", "ລາຍການສິນຄ້າ"],
    nav_stock: ["Stock", "ສະຕັອກ"],
    nav_shop: ["Shop settings", "ຕັ້ງຄ່າຮ້ານ"],
    nav_messages: ["Message templates", "ຂໍ້ຄວາມສຳເລັດຮູບ"],
    nav_backup: ["Backup & data", "ສຳຮອງຂໍ້ມູນ"],
    nav_account: ["Account & security", "ບັນຊີ ແລະ ຄວາມປອດໄພ"],
    sub_dashboard: ["How the shop is doing at a glance", "ພາບລວມຂອງຮ້ານ"],
    sub_orders: ["Track every order from new to done", "ຕິດຕາມທຸກອໍເດີ ຕັ້ງແຕ່ໃໝ່ຈົນສຳເລັດ"],
    sub_customers: ["Built automatically from your orders", "ສ້າງອັດຕະໂນມັດຈາກອໍເດີ"],
    sub_products: ["{n} products in the catalogue", "ສິນຄ້າ {n} ລາຍການ"],
    sub_stock: ["Switch pieces in or out of stock, and in or out of the shop", "ເປີດ ຫຼື ປິດ ສະຖານະມີສິນຄ້າ ແລະ ການສະແດງໃນຮ້ານ"],
    sub_shop: ["Announcement bar, contact details and payment", "ແຖບປະກາດ ຂໍ້ມູນຕິດຕໍ່ ແລະ ການຊຳລະ"],
    sub_messages: ["WhatsApp messages for each step of an order", "ຂໍ້ຄວາມ WhatsApp ສຳລັບແຕ່ລະຂັ້ນຂອງອໍເດີ"],
    sub_backup: ["Download or restore everything in one file", "ດາວໂຫຼດ ຫຼື ກູ້ຄືນຂໍ້ມູນທັງໝົດໃນໄຟລ໌ດຽວ"],
    sub_account: ["Password and automatic lock", "ລະຫັດຜ່ານ ແລະ ການລັອກອັດຕະໂນມັດ"],

    period_today: ["Today", "ມື້ນີ້"],
    period_week: ["This week", "ອາທິດນີ້"],
    period_month: ["This month", "ເດືອນນີ້"],
    period_all: ["All time", "ທັງໝົດ"],
    date_from: ["From", "ແຕ່"],
    date_to: ["To", "ຫາ"],
    k_collected: ["Collected", "ເງິນທີ່ໄດ້ຮັບ"],
    k_collected_c: ["from paid orders", "ຈາກອໍເດີທີ່ຊຳລະແລ້ວ"],
    k_orders: ["Orders", "ອໍເດີ"],
    k_orders_c: ["orders placed", "ອໍເດີທີ່ສັ່ງເຂົ້າມາ"],
    k_avg: ["Average order", "ສະເລ່ຍຕໍ່ອໍເດີ"],
    k_avg_c: ["per paid order", "ຕໍ່ອໍເດີທີ່ຊຳລະ"],
    k_open: ["Unpaid", "ຍັງບໍ່ຊຳລະ"],
    k_open_c: ["nothing unpaid right now", "ບໍ່ມີຍອດຄ້າງຊຳລະ"],
    k_open_n: ["{n} order(s) waiting for payment", "{n} ອໍເດີ ລໍຖ້າຊຳລະ"],
    c_sales_day: ["Sales by day", "ຍອດຂາຍລາຍວັນ"],
    c_sales_hour: ["Sales by hour", "ຍອດຂາຍລາຍຊົ່ວໂມງ"],
    c_sales_month: ["Sales by month", "ຍອດຂາຍລາຍເດືອນ"],
    c_sales_empty: ["Nothing sold in this period yet.", "ຍັງບໍ່ມີການຂາຍໃນຊ່ວງນີ້"],
    c_best_h: ["Best sellers", "ສິນຄ້າຂາຍດີ"],
    by_product: ["By product", "ຕາມສິນຄ້າ"],
    by_category: ["By category", "ຕາມໝວດ"],
    paid_only: ["Paid orders only", "ສະເພາະອໍເດີທີ່ຊຳລະແລ້ວ"],
    best_empty: ["No sales yet in this period.", "ຍັງບໍ່ມີການຂາຍໃນຊ່ວງນີ້"],
    other: ["Other", "ອື່ນໆ"],
    c_methods_h: ["Sales by channel", "ຍອດຂາຍຕາມຊ່ອງທາງ"],
    methods_empty: ["No paid orders yet in this period.", "ຍັງບໍ່ມີອໍເດີທີ່ຊຳລະໃນຊ່ວງນີ້"],
    c_attention_h: ["Needs attention", "ສິ່ງທີ່ຕ້ອງເຮັດ"],
    c_recent_h: ["Recent orders", "ອໍເດີລ່າສຸດ"],
    recent_empty: ["No orders yet.", "ຍັງບໍ່ມີອໍເດີ"],
    c_due_h: ["Due soon", "ໃກ້ຄົບກຳນົດ"],
    due_empty: ["No orders due in the next 7 days.", "ບໍ່ມີອໍເດີຄົບກຳນົດໃນ 7 ມື້ຂ້າງໜ້າ"],
    view_all: ["View all", "ເບິ່ງທັງໝົດ"],
    sold_n: ["× {n}", "× {n}"],
    orders_n: ["{n} order(s)", "{n} ອໍເດີ"],
    due_over: ["Overdue", "ກາຍກຳນົດ"],
    due_today: ["Due today", "ຄົບກຳນົດມື້ນີ້"],
    due_tomorrow: ["Tomorrow", "ມື້ອື່ນ"],

    o_all: ["All", "ທັງໝົດ"],
    o_check: ["Payment to check", "ລໍຖ້າກວດການຊຳລະ"],
    o_search: ["Search name, phone, order number or item", "ຄົ້ນຫາຊື່ ເບີໂທ ເລກອໍເດີ ຫຼື ສິນຄ້າ"],
    pay_all: ["Any payment", "ທຸກສະຖານະການຊຳລະ"],
    m_all: ["Any channel", "ທຸກຊ່ອງທາງ"],
    o_add: ["New order", "ອໍເດີໃໝ່"],
    o_paste_toggle: ["Paste WhatsApp order", "ວາງອໍເດີຈາກ WhatsApp"],
    o_export: ["Export CSV", "ສົ່ງອອກ CSV"],
    o_paste_h: ["Paste a WhatsApp order", "ວາງຂໍ້ຄວາມອໍເດີ WhatsApp"],
    o_paste_ph: ["Paste the message the website wrote for the customer, starting with \"Hello Minise Arte!\"", "ວາງຂໍ້ຄວາມທີ່ເວັບໄຊຂຽນໃຫ້ລູກຄ້າ ເລີ່ມດ້ວຍ \"ສະບາຍດີ Minise Arte!\""],
    o_paste_btn: ["Create order from message", "ສ້າງອໍເດີຈາກຂໍ້ຄວາມ"],
    o_paste_fail: ["No order items found in that message. Paste the whole message, including the numbered lines.", "ບໍ່ພົບລາຍການສິນຄ້າໃນຂໍ້ຄວາມ. ກະລຸນາວາງຂໍ້ຄວາມທັງໝົດ ລວມທັງແຖວທີ່ມີເລກລຳດັບ"],
    o_none: ["No orders match these filters.", "ບໍ່ພົບອໍເດີທີ່ກົງກັບຕົວກັ່ນຕອງ"],
    o_none_all: ["No orders yet. Paste a WhatsApp order or add one by hand.", "ຍັງບໍ່ມີອໍເດີ. ວາງຂໍ້ຄວາມ WhatsApp ຫຼື ເພີ່ມເອງ"],
    o_local: ["Orders are stored in this browser. Connect the folder to also keep a backup in admin-data/orders.json.", "ອໍເດີຖືກເກັບໃນບຣາວເຊີນີ້. ເຊື່ອມໂຟນເດີເພື່ອສຳຮອງໄວ້ໃນ admin-data/orders.json"],
    col_order: ["Order", "ອໍເດີ"],
    col_customer: ["Customer", "ລູກຄ້າ"],
    col_items: ["Items", "ລາຍການ"],
    col_total: ["Total", "ລວມ"],
    col_payment: ["Payment", "ການຊຳລະ"],
    col_status: ["Status", "ສະຖານະ"],
    col_due: ["Due", "ກຳນົດ"],
    col_product: ["Product", "ສິນຄ້າ"],
    col_price: ["Price", "ລາຄາ"],
    col_ig: ["Instagram", "Instagram"],
    col_phone: ["Phone", "ເບີໂທ"],
    col_orders: ["Orders", "ອໍເດີ"],
    col_spent: ["Paid total", "ຍອດທີ່ຊຳລະ"],
    col_last: ["Last order", "ອໍເດີລ່າສຸດ"],
    more_items: ["+{n} more", "+ ອີກ {n}"],
    bulk_sel: ["{n} selected", "ເລືອກ {n}"],
    bulk_clear: ["Clear", "ຍົກເລີກ"],
    bulk_done: ["{n} order(s) updated", "ອັບເດດ {n} ອໍເດີ"],
    select_all: ["Select all", "ເລືອກທັງໝົດ"],
    st_new: ["New", "ໃໝ່"],
    st_making: ["Making", "ກຳລັງເຮັດ"],
    st_ready: ["Ready", "ພ້ອມແລ້ວ"],
    st_sent: ["Sent", "ສົ່ງແລ້ວ"],
    st_done: ["Done", "ສຳເລັດ"],
    pay_unpaid: ["Not paid", "ຍັງບໍ່ຊຳລະ"],
    pay_paid: ["Paid, to check", "ຊຳລະແລ້ວ ລໍຖ້າກວດ"],
    pay_checked: ["Paid, checked", "ຊຳລະແລ້ວ ກວດແລ້ວ"],
    m_wa: ["WhatsApp", "WhatsApp"],
    m_rc: ["Paid at checkout", "ຊຳລະໃນເວັບ"],
    m_shop: ["In store", "ໜ້າຮ້ານ"],
    m_ig: ["Instagram DM", "Instagram DM"],
    act_paid: ["Mark as paid", "ໝາຍວ່າຊຳລະແລ້ວ"],
    act_checked: ["Payment checked", "ກວດການຊຳລະແລ້ວ"],
    act_making: ["Start making", "ເລີ່ມເຮັດ"],
    act_ready: ["Mark as ready", "ໝາຍວ່າພ້ອມແລ້ວ"],
    act_sent: ["Mark as sent", "ໝາຍວ່າສົ່ງແລ້ວ"],
    act_done: ["Mark as done", "ໝາຍວ່າສຳເລັດ"],
    act_back: ["Undo last step", "ຍ້ອນກັບ 1 ຂັ້ນ"],
    act_msg: ["Message customer", "ສົ່ງຂໍ້ຄວາມຫາລູກຄ້າ"],
    act_call: ["Call", "ໂທ"],
    act_print_inv: ["Print invoice", "ພິມໃບແຈ້ງໜີ້"],
    act_print_slip: ["Print packing slip", "ພິມໃບແພັກເຄື່ອງ"],
    act_edit: ["Edit order", "ແກ້ໄຂອໍເດີ"],
    act_more: ["More", "ເພີ່ມເຕີມ"],
    act_delete: ["Delete order", "ລຶບອໍເດີ"],
    act_dup: ["Duplicate order", "ສຳເນົາອໍເດີ"],
    close: ["Close", "ປິດ"],
    cancel: ["Cancel", "ຍົກເລີກ"],
    track_label: ["Courier tracking or bill number (optional)", "ເລກພັດສະດຸ ຫຼື ເລກບິນ (ບໍ່ບັງຄັບ)"],
    track_confirm: ["Confirm sent", "ຢືນຢັນວ່າສົ່ງແລ້ວ"],
    sec_customer: ["Customer", "ລູກຄ້າ"],
    sec_items: ["Items", "ລາຍການສິນຄ້າ"],
    sec_details: ["Details", "ລາຍລະອຽດ"],
    sec_note: ["Note", "ໝາຍເຫດ"],
    sec_history: ["History", "ປະຫວັດ"],
    sec_order: ["Order", "ອໍເດີ"],
    sec_money: ["Money", "ການເງິນ"],
    f_delivery: ["Delivery", "ການຈັດສົ່ງ"],
    f_address: ["Address", "ທີ່ຢູ່"],
    f_channel: ["Channel", "ຊ່ອງທາງ"],
    f_due: ["Due date", "ວັນກຳນົດ"],
    f_tracking: ["Tracking no.", "ເລກພັດສະດຸ"],
    f_created: ["Created", "ສ້າງເມື່ອ"],
    subtotal: ["Subtotal", "ລວມສິນຄ້າ"],
    discount: ["Discount", "ສ່ວນຫຼຸດ"],
    fee: ["Delivery fee", "ຄ່າສົ່ງ"],
    total: ["Total", "ຍອດລວມ"],
    to_price: ["price to confirm", "ລໍຖ້າລາຄາ"],
    plus_unknown: ["+ items still to price", "+ ລາຍການທີ່ຍັງບໍ່ມີລາຄາ"],
    log_created: ["Order added", "ເພີ່ມອໍເດີ"],
    log_paid: ["Marked as paid", "ໝາຍວ່າຊຳລະແລ້ວ"],
    log_checked: ["Payment checked", "ກວດການຊຳລະແລ້ວ"],
    log_stage: ["Moved to: {s}", "ປ່ຽນເປັນ: {s}"],
    log_edited: ["Order edited", "ແກ້ໄຂອໍເດີ"],
    log_tracking: ["Tracking number: {t}", "ເລກພັດສະດຸ: {t}"],
    toast_stage: ["{id} is now: {s}", "{id} ຕອນນີ້: {s}"],
    o_saved: ["Order saved", "ບັນທຶກອໍເດີແລ້ວ"],
    o_deleted: ["Order deleted", "ລຶບອໍເດີແລ້ວ"],
    o_del_confirm: ["Delete order {n}? This can't be undone.", "ລຶບອໍເດີ {n}? ກູ້ຄືນບໍ່ໄດ້"],
    o_edit_h: ["Edit order {id}", "ແກ້ໄຂອໍເດີ {id}"],
    o_new_h: ["New order", "ອໍເດີໃໝ່"],
    o_no: ["Order number", "ເລກອໍເດີ"],
    o_date: ["Order date", "ວັນທີສັ່ງ"],
    o_name: ["Customer name", "ຊື່ລູກຄ້າ"],
    o_phone: ["Phone / WhatsApp", "ເບີໂທ / WhatsApp"],
    o_delivery: ["Delivery method", "ວິທີຈັດສົ່ງ"],
    o_address: ["Address or branch", "ທີ່ຢູ່ ຫຼື ສາຂາ"],
    o_method: ["Channel", "ຊ່ອງທາງສັ່ງ"],
    o_pay: ["Payment", "ການຊຳລະ"],
    o_stage: ["Status", "ສະຖານະ"],
    o_due: ["Due date", "ວັນກຳນົດ"],
    o_tracking: ["Tracking number", "ເລກພັດສະດຸ"],
    o_discount: ["Discount (kip)", "ສ່ວນຫຼຸດ (ກີບ)"],
    o_fee: ["Delivery fee (kip)", "ຄ່າສົ່ງ (ກີບ)"],
    o_item: ["Item", "ສິນຄ້າ"],
    o_qty: ["Qty", "ຈຳນວນ"],
    o_details: ["Details (initials, colour…)", "ລາຍລະອຽດ (ຕົວອັກສອນ ສີ…)"],
    o_line: ["Line total (kip)", "ລວມແຖວ (ກີບ)"],
    o_add_item: ["Add item", "ເພີ່ມລາຍການ"],
    o_note: ["Notes", "ໝາຍເຫດ"],
    o_save: ["Save order", "ບັນທຶກອໍເດີ"],
    o_need: ["Add a customer name and at least one item.", "ໃສ່ຊື່ລູກຄ້າ ແລະ ຢ່າງໜ້ອຍ 1 ລາຍການ"],

    cu_total: ["Customers", "ລູກຄ້າທັງໝົດ"],
    cu_repeat: ["Repeat customers", "ລູກຄ້າກັບມາຊື້ຊ້ຳ"],
    cu_avg: ["Average paid per customer", "ຍອດຊຳລະສະເລ່ຍຕໍ່ຄົນ"],
    cu_search: ["Search customers", "ຄົ້ນຫາລູກຄ້າ"],
    cu_none: ["Customers appear here after your first order.", "ລູກຄ້າຈະສະແດງຫຼັງຈາກມີອໍເດີທຳອິດ"],
    cu_view: ["View orders", "ເບິ່ງອໍເດີ"],
    cu_repeat_badge: ["Repeat", "ລູກຄ້າປະຈຳ"],

    p_total: ["Products", "ສິນຄ້າທັງໝົດ"],
    p_visible: ["In the shop", "ສະແດງໃນຮ້ານ"],
    p_hidden: ["Hidden", "ເຊື່ອງໄວ້"],
    p_soldout: ["Sold out", "ໝົດ"],
    p_noprice: ["No price yet", "ຍັງບໍ່ມີລາຄາ"],
    p_pinned: ["Pinned best sellers", "ປັກໝຸດຂາຍດີ"],
    search_products: ["Search products", "ຄົ້ນຫາສິນຄ້າ"],
    all_types: ["All categories", "ທຸກໝວດ"],
    st_all: ["Any status", "ທຸກສະຖານະ"],
    st_visible: ["In the shop", "ສະແດງໃນຮ້ານ"],
    st_hidden: ["Hidden", "ເຊື່ອງໄວ້"],
    st_so: ["Sold out", "ໝົດ"],
    st_noprice: ["No price yet", "ຍັງບໍ່ມີລາຄາ"],
    st_pinned: ["Pinned", "ປັກໝຸດ"],
    st_old: ["Earlier designs", "ແບບກ່ອນໜ້າ"],
    sort_name: ["Name A–Z", "ຊື່ A–Z"],
    sort_new: ["Newest first", "ໃໝ່ກ່ອນ"],
    sort_likes: ["Most liked", "ຖືກໃຈຫຼາຍສຸດ"],
    sort_price: ["Price low to high", "ລາຄາ ຕ່ຳ ຫາ ສູງ"],
    add_product: ["Add product", "ເພີ່ມສິນຄ້າ"],
    shown: ["{n} shown", "ສະແດງ {n}"],
    hide: ["Hide", "ເຊື່ອງ"],
    show: ["Show", "ສະແດງ"],
    mark_so: ["Sold out", "ໝົດ"],
    mark_back: ["In stock", "ມີສິນຄ້າ"],
    ask: ["Ask for price", "ສອບຖາມລາຄາ"],
    from: ["From", "ເລີ່ມ"],
    c_hidden: ["Hidden", "ເຊື່ອງ"],
    c_so: ["Sold out", "ໝົດ"],
    c_pin: ["Pinned #{n}", "ປັກໝຸດ #{n}"],
    c_rts: ["Ready to ship", "ພ້ອມສົ່ງ"],
    c_old: ["Earlier", "ກ່ອນໜ້າ"],
    c_new: ["Not on Instagram", "ບໍ່ມີໃນ Instagram"],
    posts_likes: ["{p} posts · {l} likes", "{p} ໂພສ · {l} ຖືກໃຈ"],
    none_match: ["No products match these filters.", "ບໍ່ພົບສິນຄ້າ"],
    e_new: ["New product", "ສິນຄ້າໃໝ່"],
    e_basics: ["Basics", "ຂໍ້ມູນຫຼັກ"],
    e_name: ["Product name", "ຊື່ສິນຄ້າ"],
    e_types: ["Category", "ໝວດ"],
    e_tags: ["Collections", "ຄໍເລັກຊັນ"],
    e_price: ["Price", "ລາຄາ"],
    e_price_hint: ["One row = one price. Add a label when there are choices (Silver / Gold, One / Pair). Leave no rows to show \"Ask for price\".", "1 ແຖວ = 1 ລາຄາ. ໃສ່ຊື່ຕົວເລືອກເມື່ອມີຫຼາຍແບບ (ເງິນ / ທອງ). ຖ້າບໍ່ມີແຖວ ຈະສະແດງ \"ສອບຖາມລາຄາ\""],
    e_label_en: ["Choice (English)", "ຕົວເລືອກ (ອັງກິດ)"],
    e_label_lo: ["Choice (Lao)", "ຕົວເລືອກ (ລາວ)"],
    e_kip: ["Price (kip)", "ລາຄາ (ກີບ)"],
    e_add_price: ["Add a price", "ເພີ່ມລາຄາ"],
    e_from: ["Show the price as \"From …\"", "ສະແດງລາຄາເປັນ \"ເລີ່ມ …\""],
    e_addon: ["Extra charm (optional)", "Charm ເພີ່ມ (ບໍ່ບັງຄັບ)"],
    e_addon_hint: ["For pieces where customers can add extra charms, e.g. +75,000 kip per photo charm.", "ສຳລັບສິນຄ້າທີ່ເພີ່ມ charm ໄດ້ ເຊັ່ນ +75,000 ກີບ ຕໍ່ charm ຮູບ"],
    e_custom: ["Personalisation", "ການໃສ່ລາຍລະອຽດ"],
    e_li_min: ["Initials from", "ຕົວອັກສອນ ຕ່ຳສຸດ"],
    e_li_max: ["Initials up to", "ຕົວອັກສອນ ສູງສຸດ"],
    e_li_hint: ["Leave both empty if the piece has no initials.", "ປ່ອຍຫວ່າງ ຖ້າສິນຄ້າບໍ່ມີຕົວອັກສອນ"],
    e_colours: ["Colours", "ສີ"],
    e_features: ["Details shown on the product", "ລາຍລະອຽດທີ່ສະແດງ"],
    f_rts: ["Ready to ship", "ພ້ອມສົ່ງ"],
    f_day: ["Ready the next day", "ໄດ້ມື້ອື່ນ"],
    f_ph: ["Customer sends a photo", "ລູກຄ້າສົ່ງຮູບ"],
    f_polaroid: ["2 free Polaroids", "ແຖມ Polaroid 2 ໃບ"],
    f_stainless: ["Stainless steel", "ສະແຕນເລດ"],
    f_water: ["Waterproof", "ກັນນ້ຳ"],
    f_s925: ["S925 silver", "ເງິນ S925"],
    f_cur: ["Current collection (unticked = \"Earlier design\")", "ຄໍເລັກຊັນປັດຈຸບັນ (ບໍ່ຕິກ = \"ແບບກ່ອນໜ້າ\")"],
    e_status: ["In the shop", "ໃນໜ້າຮ້ານ"],
    f_hid: ["Hide from the shop", "ເຊື່ອງຈາກໜ້າຮ້ານ"],
    f_so: ["Sold out (customers can't add it to the bag)", "ໝົດ (ລູກຄ້າເພີ່ມໃສ່ກະຕ່າບໍ່ໄດ້)"],
    f_feat: ["Pin in best sellers at position", "ປັກໝຸດໃນສິນຄ້າຂາຍດີ ອັນດັບ"],
    f_feat_hint: ["1 = first. Leave empty to rank by Instagram likes.", "1 = ອັນດັບທຳອິດ. ປ່ອຍຫວ່າງ = ຮຽງຕາມຍອດຖືກໃຈ"],
    e_desc: ["Description", "ຄຳອະທິບາຍ"],
    e_desc_en: ["English", "ພາສາອັງກິດ"],
    e_desc_lo: ["Lao", "ພາສາລາວ"],
    e_photos: ["Photos", "ຮູບພາບ"],
    e_photos_hint: ["The first photo is the cover. Photos are resized for the web when you add them.", "ຮູບທຳອິດແມ່ນຮູບປົກ. ຮູບຈະຖືກຫຍໍ້ຂະໜາດອັດຕະໂນມັດ"],
    e_add_photos: ["Add photos", "ເພີ່ມຮູບ"],
    e_remove: ["Remove", "ລຶບ"],
    e_ig: ["Instagram posts", "ໂພສ Instagram"],
    e_save: ["Done", "ຕົກລົງ"],
    e_cancel: ["Cancel", "ຍົກເລີກ"],
    e_delete: ["Delete product", "ລຶບສິນຄ້າ"],
    e_duplicate: ["Duplicate", "ສຳເນົາສິນຄ້າ"],
    e_copy: ["(copy)", "(ສຳເນົາ)"],
    e_del_confirm: ["Delete \"{n}\" from the shop? You can't undo this after saving.", "ລຶບ \"{n}\" ອອກຈາກຮ້ານ? ຫຼັງບັນທຶກແລ້ວ ຈະກູ້ຄືນບໍ່ໄດ້"],
    e_need_name: ["Add a product name.", "ກະລຸນາໃສ່ຊື່ສິນຄ້າ"],
    e_need_type: ["Choose at least one category.", "ເລືອກຢ່າງໜ້ອຍ 1 ໝວດ"],
    e_need_photo: ["Add at least one photo.", "ເພີ່ມຮູບຢ່າງໜ້ອຍ 1 ຮູບ"],
    e_bad_price: ["Every price row needs a price in kip.", "ທຸກແຖວລາຄາຕ້ອງມີລາຄາເປັນກີບ"],
    in_stock: ["In stock", "ມີສິນຄ້າ"],
    in_shop: ["Shown in shop", "ສະແດງໃນຮ້ານ"],
    f_all: ["All", "ທັງໝົດ"],

    s_ann: ["Announcement bar", "ແຖບປະກາດ"],
    s_ann_hint: ["Up to three short messages at the top of every page. Leave a line empty to hide it.", "ສູງສຸດ 3 ຂໍ້ຄວາມສັ້ນໆ ດ້ານເທິງທຸກໜ້າ. ປ່ອຍຫວ່າງເພື່ອເຊື່ອງ"],
    s_msg: ["Message {n}", "ຂໍ້ຄວາມ {n}"],
    s_contact: ["Contact and store", "ຕິດຕໍ່ ແລະ ໜ້າຮ້ານ"],
    s_wa_main: ["Main WhatsApp (orders go here)", "WhatsApp ຫຼັກ (ອໍເດີສົ່ງມາບ່ອນນີ້)"],
    s_wa_alt: ["Second WhatsApp", "WhatsApp ທີສອງ"],
    s_hours: ["Opening hours", "ເວລາເປີດ"],
    s_addr: ["Store address", "ທີ່ຢູ່ໜ້າຮ້ານ"],
    s_pay: ["LAO QR payment", "ການຊຳລະ LAO QR"],
    s_account: ["Account name shown under the QR", "ຊື່ບັນຊີທີ່ສະແດງໃຕ້ QR"],
    s_qr: ["LAO QR image", "ຮູບ LAO QR"],
    s_qr_btn: ["Replace QR image", "ປ່ຽນຮູບ QR"],
    s_note: ["Changes appear in the shop after you press Save.", "ການປ່ຽນແປງຈະສະແດງໃນຮ້ານຫຼັງກົດບັນທຶກ"],
    en: ["English", "ອັງກິດ"],
    lo: ["Lao", "ລາວ"],

    tpl_intro: ["These messages open in WhatsApp when you press Message customer on an order. Placeholders fill in the order details automatically. Press Save to keep your changes.", "ຂໍ້ຄວາມເຫຼົ່ານີ້ຈະເປີດໃນ WhatsApp ເມື່ອກົດສົ່ງຂໍ້ຄວາມຫາລູກຄ້າ. ຕົວແທນຂໍ້ມູນຈະໃສ່ລາຍລະອຽດອໍເດີໃຫ້ອັດຕະໂນມັດ. ກົດບັນທຶກເພື່ອເກັບການປ່ຽນແປງ"],
    tpl_placeholders: ["Placeholders", "ຕົວແທນຂໍ້ມູນ"],
    tpl_pay: ["New order, not paid yet", "ອໍເດີໃໝ່ ຍັງບໍ່ຊຳລະ"],
    tpl_new: ["New order, paid", "ອໍເດີໃໝ່ ຊຳລະແລ້ວ"],
    tpl_making: ["Making", "ກຳລັງເຮັດ"],
    tpl_ready: ["Ready", "ພ້ອມແລ້ວ"],
    tpl_sent: ["Sent", "ສົ່ງແລ້ວ"],
    tpl_done: ["Done", "ສຳເລັດ"],
    tpl_reset: ["Reset to default", "ກັບຄືນຄ່າເລີ່ມຕົ້ນ"],
    msg_pay: ["Hello {name}! Thank you for your Minise Arte order {id}. The total is {total}. You can pay by LAO QR to {account} and send us the transfer screenshot.", "ສະບາຍດີ {name}! ຂອບໃຈທີ່ສັ່ງ Minise Arte ອໍເດີ {id}. ຍອດລວມ {total}. ຊຳລະຜ່ານ LAO QR ບັນຊີ {account} ແລ້ວສົ່ງພາບໜ້າຈໍການໂອນມາໃຫ້ເຮົາໄດ້ເລີຍ"],
    msg_new: ["Hello {name}! We received your Minise Arte order {id} and your payment. We'll start making it soon.", "ສະບາຍດີ {name}! ເຮົາໄດ້ຮັບອໍເດີ {id} ແລະ ການຊຳລະແລ້ວ. ຈະເລີ່ມເຮັດໃຫ້ໄວໆນີ້"],
    msg_making: ["Hello {name}! Your order {id} is confirmed and we're making it by hand now.", "ສະບາຍດີ {name}! ອໍເດີ {id} ຢືນຢັນແລ້ວ ກຳລັງເຮັດໃຫ້ຢູ່ເດີ"],
    msg_ready: ["Hello {name}! Your order {id} is ready. Delivery: {delivery}.", "ສະບາຍດີ {name}! ອໍເດີ {id} ພ້ອມແລ້ວ. ການຮັບສິນຄ້າ: {delivery}"],
    msg_sent: ["Hello {name}! Your order {id} has been sent ({delivery}). Tracking number: {tracking}. Thank you for choosing Minise Arte!", "ສະບາຍດີ {name}! ອໍເດີ {id} ສົ່ງແລ້ວ ({delivery}). ເລກພັດສະດຸ: {tracking}. ຂອບໃຈທີ່ເລືອກ Minise Arte!"],
    msg_done: ["Thank you {name}! We hope you love your Minise piece. Best gift for your best one.", "ຂອບໃຈ {name}! ຫວັງວ່າຈະມັກສິນຄ້າຂອງ Minise ເດີ"],

    bk_title: ["Download a backup", "ດາວໂຫຼດໄຟລ໌ສຳຮອງ"],
    bk_text: ["One file with all products, shop settings and orders. Keep a copy somewhere safe, for example Google Drive, every week.", "ໄຟລ໌ດຽວທີ່ມີສິນຄ້າ ການຕັ້ງຄ່າ ແລະ ອໍເດີທັງໝົດ. ເກັບໄວ້ບ່ອນປອດໄພ ເຊັ່ນ Google Drive ທຸກອາທິດ"],
    bk_btn: ["Download backup", "ດາວໂຫຼດໄຟລ໌ສຳຮອງ"],
    bk_last: ["Last backup: {d}", "ສຳຮອງລ່າສຸດ: {d}"],
    bk_never: ["No backup downloaded yet.", "ຍັງບໍ່ເຄີຍດາວໂຫຼດໄຟລ໌ສຳຮອງ"],
    bk_stats: ["{p} products · {o} orders · {c} customers", "ສິນຄ້າ {p} · ອໍເດີ {o} · ລູກຄ້າ {c}"],
    rs_title: ["Restore from a backup", "ກູ້ຄືນຈາກໄຟລ໌ສຳຮອງ"],
    rs_text: ["Replaces products, settings and orders with the ones in a backup file. Press Save afterwards to write products and settings to the folder.", "ແທນທີ່ສິນຄ້າ ການຕັ້ງຄ່າ ແລະ ອໍເດີ ດ້ວຍຂໍ້ມູນໃນໄຟລ໌ສຳຮອງ. ກົດບັນທຶກຫຼັງຈາກນັ້ນ"],
    rs_btn: ["Choose backup file", "ເລືອກໄຟລ໌ສຳຮອງ"],
    rs_confirm: ["Replace everything with this backup from {d}? ({p} products, {o} orders)", "ແທນທີ່ຂໍ້ມູນທັງໝົດດ້ວຍໄຟລ໌ສຳຮອງວັນທີ {d}? (ສິນຄ້າ {p}, ອໍເດີ {o})"],
    rs_done: ["Backup restored. Press Save to write products and settings.", "ກູ້ຄືນແລ້ວ. ກົດບັນທຶກເພື່ອຂຽນສິນຄ້າ ແລະ ການຕັ້ງຄ່າ"],
    rs_bad: ["That file isn't a Minise backup.", "ໄຟລ໌ນີ້ບໍ່ແມ່ນໄຟລ໌ສຳຮອງຂອງ Minise"],
    dz_title: ["Delete all orders", "ລຶບອໍເດີທັງໝົດ"],
    dz_text: ["Removes every order stored in this browser, for example before handing the computer to someone else. Download a backup first.", "ລຶບທຸກອໍເດີທີ່ເກັບໃນບຣາວເຊີນີ້. ດາວໂຫຼດໄຟລ໌ສຳຮອງກ່ອນ"],
    dz_btn: ["Delete all orders", "ລຶບອໍເດີທັງໝົດ"],
    dz_confirm: ["Delete all {n} orders? This can't be undone.", "ລຶບອໍເດີທັງໝົດ {n} ອໍເດີ? ກູ້ຄືນບໍ່ໄດ້"],
    dz_done: ["All orders deleted", "ລຶບອໍເດີທັງໝົດແລ້ວ"],

    pw_title: ["Change password", "ປ່ຽນລະຫັດຜ່ານ"],
    pw_current: ["Current password", "ລະຫັດຜ່ານປັດຈຸບັນ"],
    pw_change: ["Change password", "ປ່ຽນລະຫັດຜ່ານ"],
    pw_done: ["Password changed.", "ປ່ຽນລະຫັດຜ່ານແລ້ວ"],
    al_title: ["Automatic lock", "ລັອກອັດຕະໂນມັດ"],
    al_text: ["Lock the admin after a period without activity. It doesn't apply when you chose to stay signed in.", "ລັອກໜ້າຜູ້ດູແລເມື່ອບໍ່ມີການໃຊ້ງານໄລຍະໜຶ່ງ. ບໍ່ໃຊ້ເມື່ອເລືອກຈື່ການເຂົ້າລະບົບ"],
    al_off: ["Off", "ປິດ"],
    al_min: ["After {n} minutes", "ຫຼັງຈາກ {n} ນາທີ"],
    al_saved: ["Automatic lock updated", "ອັບເດດການລັອກອັດຕະໂນມັດແລ້ວ"],
    al_locked: ["Locked after inactivity. Sign in again to continue.", "ລັອກແລ້ວ ເພາະບໍ່ມີການໃຊ້ງານ. ເຂົ້າສູ່ລະບົບອີກຄັ້ງ"],

    lg_kicker: ["Admin console", "ຈັດການຮ້ານ"],
    lg_welcome: ["Welcome back", "ຍິນດີຕ້ອນຮັບກັບມາ"],
    lg_sub: ["Sign in to manage your shop", "ເຂົ້າສູ່ລະບົບເພື່ອຈັດການຮ້ານ"],
    lg_create: ["Create your admin password", "ສ້າງລະຫັດຜ່ານຜູ້ດູແລ"],
    lg_create_sub: ["Choose a password for this admin. You'll use it each time you open it.", "ຕັ້ງລະຫັດຜ່ານສຳລັບໜ້າຜູ້ດູແລ. ຈະໃຊ້ທຸກຄັ້ງທີ່ເປີດ"],
    lg_pass: ["Password", "ລະຫັດຜ່ານ"],
    lg_new_pass: ["New password (at least 6 characters)", "ລະຫັດຜ່ານໃໝ່ (ຢ່າງໜ້ອຍ 6 ຕົວ)"],
    lg_confirm: ["Type it again", "ພິມອີກຄັ້ງ"],
    lg_show: ["Show", "ສະແດງ"],
    lg_hide: ["Hide", "ເຊື່ອງ"],
    lg_remember: ["Keep me signed in on this computer for 30 days", "ຈື່ການເຂົ້າລະບົບໃນຄອມນີ້ 30 ມື້"],
    lg_signin: ["Sign in", "ເຂົ້າສູ່ລະບົບ"],
    lg_save: ["Create password and sign in", "ສ້າງລະຫັດ ແລະ ເຂົ້າສູ່ລະບົບ"],
    lg_wrong: ["That password isn't right. Try again.", "ລະຫັດຜ່ານບໍ່ຖືກ. ລອງໃໝ່"],
    lg_short: ["Use at least 6 characters.", "ກະລຸນາໃຊ້ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ"],
    lg_mismatch: ["The two passwords don't match.", "ລະຫັດຜ່ານທັງສອງບໍ່ກົງກັນ"],
    lg_forgot: ["Forgot password?", "ລືມລະຫັດຜ່ານ?"],
    lg_reset_text: ["To reset, type RESET below. A password changed on this computer is removed and the original admin password works again. Your products, settings and orders stay.", "ເພື່ອຕັ້ງລະຫັດໃໝ່ ພິມ RESET ຂ້າງລຸ່ມ. ລະຫັດທີ່ປ່ຽນໃນຄອມນີ້ຈະຖືກລຶບ ແລະ ກັບໄປໃຊ້ລະຫັດຜ່ານເດີມ. ສິນຄ້າ ການຕັ້ງຄ່າ ແລະ ອໍເດີ ຍັງຢູ່"],
    lg_reset_btn: ["Reset password", "ຕັ້ງລະຫັດໃໝ່"],
    lg_reset_bad: ["Type RESET in capital letters to confirm.", "ພິມ RESET ເປັນຕົວພິມໃຫຍ່ເພື່ອຢືນຢັນ"],
    lg_note: ["The password keeps this admin private on this computer. Don't put admin.html on the public website.", "ລະຫັດຜ່ານນີ້ປ້ອງກັນໜ້າຜູ້ດູແລໃນຄອມນີ້. ຢ່າອັບໂຫຼດ admin.html ຂຶ້ນເວັບໄຊສາທາລະນະ"],

    nav_online: ["Online orders", "ອໍເດີອອນລາຍ"],
    sub_online: ["Website orders, the admin and your Google Sheet, connected", "ເຊື່ອມເວັບໄຊ ໜ້າຜູ້ດູແລ ແລະ Google Sheet"],
    publish: ["Publish changes", "ເຜີຍແຜ່ການປ່ຽນແປງ"],
    publish_n: ["Publish {n} change(s)", "ເຜີຍແຜ່ {n} ການປ່ຽນແປງ"],
    published_all: ["Shop is up to date", "ໜ້າຮ້ານເປັນປັດຈຸບັນ"],
    published: ["Published. Customers see the changes the next time they open the shop.", "ເຜີຍແຜ່ແລ້ວ. ລູກຄ້າຈະເຫັນການປ່ຽນແປງເມື່ອເປີດໜ້າຮ້ານຄັ້ງຕໍ່ໄປ"],
    first_publish: ["Your catalogue is now online.", "ລາຍການສິນຄ້າອອນລາຍແລ້ວ"],
    publish_fail: ["Couldn't publish: {e}. Your changes are still here; try again.", "ເຜີຍແຜ່ບໍ່ສຳເລັດ: {e}. ການປ່ຽນແປງຍັງຢູ່; ລອງໃໝ່"],
    on_status_ok: ["Online · synced {t}", "ອອນລາຍ · ອັບເດດ {t}"],
    on_status_wait: ["Online · connecting…", "ອອນລາຍ · ກຳລັງເຊື່ອມຕໍ່…"],
    on_status_err: ["Offline · changes sync when the connection is back", "ອອບລາຍ · ຈະອັບເດດເມື່ອເຊື່ອມຕໍ່ໄດ້"],
    new_web_orders: ["{n} new order(s) from the website", "ອໍເດີໃໝ່ຈາກເວັບໄຊ {n} ອໍເດີ"],
    log_web: ["Order placed on the website", "ລູກຄ້າສັ່ງຜ່ານເວັບໄຊ"],
    log_web_rc: ["Paid at checkout on the website, slip attached", "ຊຳລະຜ່ານເວັບໄຊ ແນບສະລິບ"],
    web_badge: ["Website", "ເວັບໄຊ"],
    sec_slip: ["Payment slip", "ສະລິບການໂອນ"],
    slip_view: ["View payment slip", "ເບິ່ງສະລິບການໂອນ"],
    slip_loading: ["Loading slip…", "ກຳລັງໂຫຼດສະລິບ…"],
    slip_fail: ["Couldn't load the slip. Check the connection and try again.", "ໂຫຼດສະລິບບໍ່ໄດ້. ກວດການເຊື່ອມຕໍ່ ແລ້ວລອງໃໝ່"],
    f_ref: ["Transfer", "ການໂອນ"],
    lg_net: ["Can't reach Google right now. Check the internet connection and try again.", "ເຊື່ອມຕໍ່ Google ບໍ່ໄດ້. ກວດອິນເຕີເນັດ ແລ້ວລອງໃໝ່"],
    lg_too_many: ["Too many wrong tries. Wait 15 minutes, then try again.", "ລອງຜິດຫຼາຍເກີນໄປ. ລໍຖ້າ 15 ນາທີ ແລ້ວລອງໃໝ່"],
    lg_exists: ["A password was already created. Sign in with it.", "ມີລະຫັດຜ່ານແລ້ວ. ເຂົ້າສູ່ລະບົບດ້ວຍລະຫັດນັ້ນ"],
    lg_session_end: ["You were signed out. Please sign in again.", "ອອກຈາກລະບົບແລ້ວ. ກະລຸນາເຂົ້າສູ່ລະບົບອີກຄັ້ງ"],
    lg_reset_online: ["Open your Google Sheet, then Extensions → Apps Script. Choose resetPassword at the top, press Run, then come back here and create a new password straight away.", "ເປີດ Google Sheet ຂອງທ່ານ ແລ້ວໄປ Extensions → Apps Script. ເລືອກ resetPassword ດ້ານເທິງ ກົດ Run ແລ້ວກັບມາສ້າງລະຫັດໃໝ່ທັນທີ"],
    lg_note_online: ["Your password is checked by your own Google Sheet, so this admin works on any computer or phone with the link.", "ລະຫັດຜ່ານຖືກກວດໂດຍ Google Sheet ຂອງທ່ານເອງ ຈຶ່ງໃຊ້ໜ້າຜູ້ດູແລໄດ້ທຸກຄອມ ຫຼື ໂທລະສັບ"],
    on_h_connected: ["Connected to Google Sheets", "ເຊື່ອມ Google Sheets ແລ້ວ"],
    on_connected_p: ["Website orders arrive here automatically, every change you make to an order is saved in your Google Sheet, and Publish changes sends products and shop settings straight to the shop.", "ອໍເດີຈາກເວັບໄຊເຂົ້າມາບ່ອນນີ້ອັດຕະໂນມັດ ທຸກການປ່ຽນແປງອໍເດີຖືກບັນທຶກໃນ Google Sheet ແລະ ປຸ່ມເຜີຍແຜ່ຈະສົ່ງສິນຄ້າ ແລະ ການຕັ້ງຄ່າໄປໜ້າຮ້ານທັນທີ"],
    on_url: ["Web app link", "ລິ້ງ Web app"],
    on_sheet: ["Open the order sheet", "ເປີດ Google Sheet ອໍເດີ"],
    on_sync: ["Sync now", "ອັບເດດດຽວນີ້"],
    on_last: ["Last synced", "ອັບເດດລ່າສຸດ"],
    on_never: ["Not yet", "ຍັງບໍ່ທັນ"],
    on_web_h: ["One step left for the website", "ອີກ 1 ຂັ້ນສຳລັບເວັບໄຊ"],
    on_web_p: ["The shop finds your Google Sheet through js/settings.js. Download settings.js and put it in the website's js folder, replacing the old file. Then upload the website again if it is already online.", "ໜ້າຮ້ານຊອກຫາ Google Sheet ຜ່ານໄຟລ໌ js/settings.js. ດາວໂຫຼດ settings.js ແລ້ວໃສ່ໃນໂຟນເດີ js ແທນໄຟລ໌ເກົ່າ. ຖ້າເວັບໄຊອອນລາຍແລ້ວ ໃຫ້ອັບໂຫຼດອີກຄັ້ງ"],
    on_web_btn: ["Download settings.js", "ດາວໂຫຼດ settings.js"],
    on_web_ok: ["The website's settings.js has this link, so customer orders come here.", "ໄຟລ໌ settings.js ຂອງເວັບໄຊມີລິ້ງນີ້ແລ້ວ ອໍເດີລູກຄ້າຈຶ່ງເຂົ້າມາບ່ອນນີ້"],
    on_disconnect: ["Disconnect this browser", "ຕັດການເຊື່ອມຕໍ່ບຣາວເຊີນີ້"],
    on_disc_p: ["Signs out and stops using the online orders in this browser. Your orders stay safe in the Google Sheet.", "ອອກຈາກລະບົບ ແລະ ຢຸດໃຊ້ອໍເດີອອນລາຍໃນບຣາວເຊີນີ້. ອໍເດີຍັງປອດໄພໃນ Google Sheet"],
    on_disc_file: ["This link also comes from js/settings.js, so the admin reconnects when the page reloads. Remove the link from that file to stop for good.", "ລິ້ງນີ້ມາຈາກ js/settings.js ດ້ວຍ ໜ້າຜູ້ດູແລຈຶ່ງຈະເຊື່ອມຕໍ່ໃໝ່ເມື່ອໂຫຼດໜ້າໃໝ່. ລຶບລິ້ງອອກຈາກໄຟລ໌ນັ້ນເພື່ອຢຸດຖາວອນ"],
    on_disc_confirm: ["Disconnect this browser from the online orders?", "ຕັດການເຊື່ອມຕໍ່ບຣາວເຊີນີ້ຈາກອໍເດີອອນລາຍ?"],
    on_h_setup: ["Receive website orders automatically", "ຮັບອໍເດີຈາກເວັບໄຊອັດຕະໂນມັດ"],
    on_setup_p: ["Connect a free Google Sheet in your Google account. Orders from the website, including payment slips, then arrive here and in the sheet, this admin works from any device, and product changes go live without moving files.", "ເຊື່ອມ Google Sheet ຟຣີ ໃນບັນຊີ Google ຂອງທ່ານ. ອໍເດີຈາກເວັບໄຊ ລວມທັງສະລິບການໂອນ ຈະເຂົ້າມາບ່ອນນີ້ ແລະ ໃນ Sheet, ໃຊ້ໜ້າຜູ້ດູແລໄດ້ທຸກອຸປະກອນ ແລະ ການແກ້ໄຂສິນຄ້າຂຶ້ນໜ້າຮ້ານທັນທີ"],
    on_s1: ["Go to sheets.new to create a Google Sheet. Name it Minise Arte orders.", "ເຂົ້າ sheets.new ເພື່ອສ້າງ Google Sheet ຕັ້ງຊື່ Minise Arte orders"],
    on_s2: ["In the sheet, open Extensions → Apps Script. Delete the code there and paste everything from google-backend/Code.gs in your website folder. Press Save.", "ໃນ Sheet ເປີດ Extensions → Apps Script. ລຶບໂຄດເກົ່າ ແລ້ວວາງໂຄດທັງໝົດຈາກໄຟລ໌ google-backend/Code.gs ໃນໂຟນເດີເວັບໄຊ. ກົດ Save"],
    on_s3: ["Choose checkSetup next to Run and press Run. Allow access: choose your account, then Advanced → Go to (unsafe) → Allow. This is your own script.", "ເລືອກ checkSetup ຂ້າງປຸ່ມ Run ແລ້ວກົດ Run. ອະນຸຍາດ: ເລືອກບັນຊີ ແລ້ວ Advanced → Go to (unsafe) → Allow. ນີ້ແມ່ນສະຄຣິບຂອງທ່ານເອງ"],
    on_s4: ["Press Deploy → New deployment. Click the gear and choose Web app. Execute as: Me. Who has access: Anyone. Press Deploy.", "ກົດ Deploy → New deployment. ກົດຮູບເຟືອງ ເລືອກ Web app. Execute as: Me. Who has access: Anyone. ກົດ Deploy"],
    on_s5: ["Copy the Web app URL (it ends with /exec), paste it below and press Connect. Then create your admin password.", "ສຳເນົາ Web app URL (ລົງທ້າຍດ້ວຍ /exec) ວາງຂ້າງລຸ່ມ ແລ້ວກົດເຊື່ອມຕໍ່. ຈາກນັ້ນສ້າງລະຫັດຜ່ານ"],
    on_url_ph: ["https://script.google.com/macros/s/…/exec", "https://script.google.com/macros/s/…/exec"],
    on_connect: ["Connect", "ເຊື່ອມຕໍ່"],
    on_checking: ["Checking the link…", "ກຳລັງກວດລິ້ງ…"],
    on_bad_url: ["That doesn't look like a web app link. It starts with https://script.google.com/ and ends with /exec.", "ລິ້ງນີ້ບໍ່ແມ່ນລິ້ງ Web app. ລິ້ງຈະເລີ່ມດ້ວຍ https://script.google.com/ ແລະ ລົງທ້າຍດ້ວຍ /exec"],
    on_no_answer: ["The link didn't answer like the Minise script. Check that it was deployed as a Web app with access for Anyone, then try again.", "ລິ້ງບໍ່ຕອບກັບຄືສະຄຣິບ Minise. ກວດວ່າ Deploy ເປັນ Web app ແລະ ເລືອກ Anyone ແລ້ວລອງໃໝ່"],
    on_connected_toast: ["Connected. Now create your admin password.", "ເຊື່ອມຕໍ່ແລ້ວ. ຕໍ່ໄປສ້າງລະຫັດຜ່ານ"],
    bk_files_title: ["Website files", "ໄຟລ໌ເວັບໄຊ"],
    bk_files_text: ["products.js and settings.js with everything as it is now. Put them in the js folder before you upload the website again, so first-time visitors see the latest catalogue straight away.", "products.js ແລະ settings.js ຕາມຂໍ້ມູນປັດຈຸບັນ. ໃສ່ໃນໂຟນເດີ js ກ່ອນອັບໂຫຼດເວັບໄຊອີກຄັ້ງ"],
    bk_files_btn: ["Download website files", "ດາວໂຫຼດໄຟລ໌ເວັບໄຊ"],
    dz_text_online: ["Removes every order here and in your Google Sheet. Download a backup first.", "ລຶບທຸກອໍເດີບ່ອນນີ້ ແລະ ໃນ Google Sheet. ດາວໂຫຼດໄຟລ໌ສຳຮອງກ່ອນ"],
    inv_title: ["Invoice", "ໃບແຈ້ງໜີ້"],
    slip_title: ["Packing slip", "ໃບແພັກເຄື່ອງ"],
    inv_bill_to: ["Customer", "ລູກຄ້າ"],
    inv_order: ["Order", "ອໍເດີ"],
    inv_date: ["Date", "ວັນທີ"],
    inv_item: ["Item", "ສິນຄ້າ"],
    inv_qty: ["Qty", "ຈຳນວນ"],
    inv_amount: ["Amount", "ຈຳນວນເງິນ"],
    inv_paid: ["Paid. Thank you!", "ຊຳລະແລ້ວ. ຂອບໃຈ!"],
    inv_pay: ["Please pay by LAO QR", "ກະລຸນາຊຳລະຜ່ານ LAO QR"],
    inv_thanks: ["Thank you for shopping with Minise Arte. Best gift for your best one.", "ຂອບໃຈທີ່ອຸດໜູນ Minise Arte"],
    slip_packed: ["Packed", "ແພັກແລ້ວ"]
  };

  /* ---------- storage ---------- */
  function load(k, json) { try { var v = localStorage.getItem(k); return json ? (v ? JSON.parse(v) : null) : v; } catch (e) { return null; } }
  function store(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); return true; } catch (e) { return false; } }
  var idb = {
    open: function () {
      return new Promise(function (res, rej) {
        try {
          var r = indexedDB.open("minise-admin", 1);
          r.onupgradeneeded = function () { r.result.createObjectStore("kv"); };
          r.onsuccess = function () { res(r.result); };
          r.onerror = function () { rej(r.error); };
        } catch (e) { rej(e); }
      });
    },
    get: function (k) { return idb.open().then(function (db) { return new Promise(function (res) { var q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(null); }; }); }).catch(function () { return null; }); },
    set: function (k, v) { return idb.open().then(function (db) { return new Promise(function (res) { var tx = db.transaction("kv", "readwrite"); tx.objectStore("kv").put(v, k); tx.oncomplete = function () { res(true); }; tx.onerror = function () { res(false); }; }); }).catch(function () { return false; }); }
  };

  /* ---------- helpers (dates first: normalizeOrder uses them) ---------- */
  function pad2(n) { return String(n).padStart(2, "0"); }
  function isoDate(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function todayISO() { return isoDate(new Date()); }
  function addDays(iso, n) { var d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return isoDate(d); }
  function daysBetween(fromIso, toIso) { return Math.round((new Date(toIso + "T00:00:00") - new Date(fromIso + "T00:00:00")) / 86400000); }

  /* ---------- state ---------- */
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  var TYPES = ["locket", "bracelet", "necklace", "set", "earrings", "accessory"];
  var TAGS = ["photo", "pet", "clover", "butterfly", "flower", "couple", "italian", "christmas"];
  var STAGES = ["new", "making", "ready", "sent", "done"];
  var PAYS = ["unpaid", "paid", "checked"];
  var METHODS = ["wa", "rc", "shop", "ig"];
  var NEXT = { "new": "making", making: "ready", ready: "sent", sent: "done" };
  var TPL_KEYS = ["pay", "new", "making", "ready", "sent", "done"];
  var TABS = ["dashboard", "orders", "customers", "products", "stock", "shop", "online", "messages", "backup", "account"];
  function normalizeOrder(o) {
    o = o || {};
    o.items = Array.isArray(o.items) ? o.items : [];
    o.log = Array.isArray(o.log) ? o.log : [];
    o.discount = +o.discount || 0;
    o.fee = +o.fee || 0;
    o.date = o.date || todayISO();
    o.created = o.created || (o.date + "T12:00:00");
    o.stage = STAGES.indexOf(o.stage) > -1 ? o.stage : "new";
    o.pay = PAYS.indexOf(o.pay) > -1 ? o.pay : "unpaid";
    o.method = METHODS.indexOf(o.method) > -1 ? o.method : "wa";
    ["id", "name", "phone", "delivery", "address", "note", "due", "tracking", "ref", "slip"].forEach(function (k) { o[k] = o[k] || ""; });
    o.lang = o.lang === "lo" ? "lo" : "en";
    o.web = !!o.web;
    return o;
  }
  var lang = load("minise_admin_lang") === "lo" ? "lo" : "en";
  var products = clone(window.MINISE_PRODUCTS || []);
  var settings = Object.assign({
    ann: [["", ""], ["", ""], ["", ""]], wa: { mainShow: "020 5524 6154", altShow: "020 5524 4246" },
    hours: ["", ""], addr: ["", ""], account: "", qr: "images/laoqr.png", templates: {}, api: ""
  }, clone(window.MINISE_SETTINGS || {}));
  while (settings.ann.length < 3) settings.ann.push(["", ""]);
  if (!settings.templates) settings.templates = {};
  var orders = (load("minise_orders", true) || []).map(normalizeOrder);
  var dirty = 0, dir = null, savedDir = null, typedSettings = false;
  // online mode: orders, products and the password live in the Google Sheet backend (google-backend/Code.gs)
  var API = String(load("minise_api") || settings.api || "").trim();
  var ONLINE = !!API;
  var TOKEN = "";
  try { TOKEN = sessionStorage.getItem("minise_api_token") || localStorage.getItem("minise_api_token") || ""; } catch (e) { TOKEN = ""; }
  var SYNC = { snap: {}, at: 0, state: "wait", busy: false, pull: false, push: false, sheet: "", version: "", ready: false };
  var NEWCOUNT = 0, SLIPS = {}, pendingRender = false;
  var tab = (location.hash || "").slice(1);
  if (TABS.indexOf(tab) < 0) tab = "dashboard";
  var PF = { q: "", type: "all", status: "all", sort: "name" };
  var OF = { q: "", stage: "all", pay: "all", method: "all" };
  var CF = { q: "" };
  var SQ = { q: "", f: "all" };
  var DF = { preset: "today", from: "", to: "", by: "product" };
  var SEL = {};
  var DR = null;
  var editing = null, editingIndex = -1, editingOrder = null;

  function a(k, vars) {
    var src = AT[k] || T[k];
    var s = src ? (src[lang === "lo" ? 1 : 0] || src[0]) : k;
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split("{" + v + "}").join(vars[v]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return Number(n || 0).toLocaleString("en-US") + " ₭"; }
  function locale() { return lang === "lo" ? "lo-LA" : "en-GB"; }
  function fmtDate(iso) { if (!iso) return ""; try { return new Date(iso + "T00:00:00").toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return iso; } }
  function fmtWhen(isoTime) { try { return new Date(isoTime).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return isoTime; } }
  function num(v) { var n = parseInt(String(v == null ? "" : v).replace(/[^\d]/g, ""), 10); return isNaN(n) ? 0 : n; }
  function slugify(s) { return String(s).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "product"; }
  function uniqueSlug(base, except) { var s = base, i = 2; while (products.some(function (p) { return p.s === s && p !== except; })) s = base + "-" + i++; return s; }
  function typeName(ty) { return a("type_" + ty); }
  function intlPhone(raw) { var d = String(raw || "").replace(/\D/g, ""); if (!d) return ""; if (d.indexOf("856") === 0) return d; return "856" + d.replace(/^0/, ""); }
  function findProduct(name) { var n = String(name || "").trim().toLowerCase(); for (var i = 0; i < products.length; i++) if (products[i].n.toLowerCase() === n) return products[i]; return null; }
  function orderSub(o) { return o.items.reduce(function (s, it) { return s + (it.price || 0); }, 0); }
  function orderTotal(o) { return Math.max(0, orderSub(o) - (o.discount || 0) + (o.fee || 0)); }
  function hasUnknown(o) { return o.items.some(function (it) { return !it.price; }); }
  function isPaid(o) { return o.pay === "paid" || o.pay === "checked"; }
  function orderById(id) { for (var i = 0; i < orders.length; i++) if (orders[i].id === id) return orders[i]; return null; }
  function phoneDigits(v) { return String(v || "").replace(/\D/g, "").replace(/^856/, "").replace(/^0/, ""); }
  function customerKey(o) { var d = phoneDigits(o.phone); return d ? "tel:" + d : "name:" + String(o.name || "").trim().toLowerCase(); }
  function priceLabel(p) {
    if (!p.o || !p.o.length) return '<span class="ask">' + esc(a("ask")) + "</span>";
    var min = Math.min.apply(null, p.o.map(function (o) { return o.price; }));
    return '<span class="num">' + esc((p.o.length > 1 || p.from ? a("from") + " " : "") + money(min)) + "</span>";
  }
  function toast(msg, ms) {
    var el = document.getElementById("toast");
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, ms || 3200);
  }
  function markDirty() { dirty++; renderHead(); }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url; link.download = name;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function dataURLtoBlob(dataURL) {
    var parts = dataURL.split(","), mime = parts[0].match(/:(.*?);/)[1], bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function resizeImage(file, maxSide, quality) {
    return new Promise(function (res, rej) {
      var reader = new FileReader();
      reader.onerror = function () { rej(reader.error); };
      reader.onload = function () {
        var im = new Image();
        im.onload = function () {
          var sc = Math.min(1, maxSide / Math.max(im.width, im.height));
          var c = document.createElement("canvas");
          c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL("image/jpeg", quality || 0.82));
        };
        im.onerror = function () { rej(new Error("not an image")); };
        im.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- icons ---------- */
  var IC = {
    dashboard: '<rect x="3.5" y="3.5" width="7" height="8" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.5"/>',
    orders: '<path d="M6 3.5h12v17l-2.5-1.6L13 20.5l-2.5-1.6L8 20.5l-2-1.3V3.5Z"/><path d="M9 8h6M9 11.5h6M9 15h4"/>',
    customers: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.8 14.2c2.3.2 4 1.8 4.6 4.3"/>',
    products: '<path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5l8 8-9 9-8-8Z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
    stock: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    shop: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5V20h13v-8.5M10 20v-4.5h4V20"/>',
    messages: '<path d="M4 5.5h16v10H9l-5 4v-14Z"/><path d="M8 9.5h8M8 12.5h5"/>',
    backup: '<ellipse cx="12" cy="6" rx="7.5" ry="2.5"/><path d="M4.5 6v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V6M4.5 12v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-6"/>',
    account: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    folder: '<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7Z"/>',
    external: '<path d="M10 14 20 4M14 4h6v6"/><path d="M19 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H10"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z"/>',
    logout: '<path d="M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
    upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14"/>',
    printer: '<path d="M7 8.5V4h10v4.5"/><rect x="4" y="8.5" width="16" height="7.5" rx="1.5"/><path d="M7 13.5h10V20H7z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
    check: '<path d="m5 12.5 4.2 4L19 7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    undo: '<path d="M9 7 4.5 11.5 9 16"/><path d="M4.5 11.5H15a4.5 4.5 0 0 1 0 9h-2"/>',
    chat: '<path d="M4.5 19.5 6 15.6A7.5 7.5 0 1 1 9 18.6l-4.5.9Z"/>',
    phone: '<path d="M6.5 4h3l1.5 4-2 1.2a10 10 0 0 0 5.8 5.8L16 13l4 1.5v3A2.5 2.5 0 0 1 17.5 20C10.6 20 4 13.4 4 6.5A2.5 2.5 0 0 1 6.5 4Z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    money: '<rect x="3.5" y="6.5" width="17" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M7 9.5v5M17 9.5v5"/>',
    cart: '<path d="M4 5h2l2 10h10l2-7H7.2"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
    avg: '<path d="M4 19.5h16M7 16V11M12 16V6.5M17 16v-7"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    paste: '<rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9.5 4.5V3.5h5v1M9 10h6M9 13.5h6M9 17h4"/>',
    cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.7-1.2A4.6 4.6 0 0 0 7 18.5Z"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>'
  };
  function icon(name) { return '<span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[name] || "") + "</svg></span>"; }

  /* ---------- files ---------- */
  function productsFile() {
    return "/* Minise Arte catalogue. Built from @minise.arte Instagram (565 posts read on 2026-10-04), edited in admin.html on " + todayISO() + ".\n   One entry per product. Edit with admin.html rather than by hand. */\nwindow.MINISE_PRODUCTS = " + JSON.stringify(products) + ";\n";
  }
  function settingsFile() {
    return "/* Minise Arte shop settings. Edit these in admin.html (Settings) rather than by hand. */\nwindow.MINISE_SETTINGS = " + JSON.stringify(settings, null, 2) + ";\n";
  }
  function writeFile(dirHandle, name, data) {
    return dirHandle.getFileHandle(name, { create: true }).then(function (fh) {
      return fh.createWritable().then(function (w) { return w.write(data).then(function () { return w.close(); }); });
    });
  }
  function ensurePermission(handle) {
    if (!handle.queryPermission) return Promise.resolve(true);
    return handle.queryPermission({ mode: "readwrite" }).then(function (st) {
      if (st === "granted") return true;
      return handle.requestPermission({ mode: "readwrite" }).then(function (r) { return r === "granted"; });
    });
  }
  function isSiteFolder(handle) {
    return handle.getDirectoryHandle("js").then(function (js) { return js.getFileHandle("products.js"); }).then(function () { return true; }, function () { return false; });
  }
  function connect() {
    if (!window.showDirectoryPicker) { toast(a("no_fs"), 6000); return; }
    window.showDirectoryPicker({ id: "minise-site", mode: "readwrite" }).then(function (h) {
      return isSiteFolder(h).then(function (ok) {
        if (!ok) { toast(a("wrong_folder"), 6000); return; }
        dir = h; savedDir = h;
        idb.set("dir", h);
        return loadOrdersFromFolder().then(render);
      });
    }, function () { /* picker closed */ });
  }
  function reconnect() {
    ensurePermission(savedDir).then(function (ok) {
      if (ok) { dir = savedDir; loadOrdersFromFolder().then(render); }
    }, function () { toast(a("no_fs"), 6000); });
  }
  function afterSaved() { dirty = 0; typedSettings = false; }
  function saveAll() {
    if (ONLINE) { publishOnline(false); return; }
    if (!dir) {
      download("products.js", productsFile(), "text/javascript;charset=utf-8");
      setTimeout(function () { download("settings.js", settingsFile(), "text/javascript;charset=utf-8"); }, 400);
      afterSaved(); renderHead();
      toast(a("saved_dl"), 8000);
      return;
    }
    var btn = document.getElementById("saveBtn");
    btn.disabled = true;
    var stamp = Date.now().toString(36);
    ensurePermission(dir).then(function (ok) {
      if (!ok) throw new Error("permission denied");
      return Promise.all([dir.getDirectoryHandle("photos-new", { create: true }), dir.getDirectoryHandle("images", { create: true })]);
    }).then(function (dirs) {
      var jobs = [];
      products.forEach(function (p) {
        p.img = p.img.map(function (src, i) {
          if (src.indexOf("data:") !== 0) return src;
          var name = p.s + "-" + stamp + "-" + (i + 1) + ".jpg";
          jobs.push(writeFile(dirs[0], name, dataURLtoBlob(src)));
          return "photos-new/" + name;
        });
      });
      if (settings.qr && settings.qr.indexOf("data:") === 0) {
        var qn = "laoqr-" + stamp + "." + (settings.qr.indexOf("image/png") > -1 ? "png" : "jpg");
        jobs.push(writeFile(dirs[1], qn, dataURLtoBlob(settings.qr)));
        settings.qr = "images/" + qn;
      }
      return Promise.all(jobs);
    }).then(function () {
      return dir.getDirectoryHandle("js").then(function (js) {
        return Promise.all([writeFile(js, "products.js", productsFile()), writeFile(js, "settings.js", settingsFile())]);
      });
    }).then(saveOrdersToFolder).then(function () {
      afterSaved(); btn.disabled = false; render();
      toast(a("saved"));
    }).catch(function (e) {
      btn.disabled = false;
      toast(a("save_fail", { e: e && e.message ? e.message : e }), 8000);
    });
  }
  function saveOrders() {
    store("minise_orders", orders);
    clearTimeout(saveOrders._t);
    saveOrders._t = setTimeout(ONLINE ? pushOrders : saveOrdersToFolder, ONLINE ? 300 : 800);
  }

  /* ---------- online backend (Google Sheet) ---------- */
  function setToken(t, remember) {
    TOKEN = t || "";
    try { sessionStorage.removeItem("minise_api_token"); localStorage.removeItem("minise_api_token"); } catch (e) { /* storage blocked */ }
    if (TOKEN) { try { (remember ? localStorage : sessionStorage).setItem("minise_api_token", TOKEN); } catch (e) { /* stays in memory */ } }
  }
  function api(action, data) {
    var body = JSON.stringify(Object.assign({ action: action, token: TOKEN }, data || {}));
    return fetch(API, { method: "POST", body: body }).then(function (r) { return r.text(); }).then(function (txt) {
      var res;
      try { res = JSON.parse(txt); } catch (e) { throw new Error(a("lg_net")); }
      if (res && res.error === "auth" && action !== "login" && action !== "setup") authLost();
      return res;
    });
  }
  function authLost() {
    if (document.body.classList.contains("locked")) return;
    setToken("");
    logout(a("lg_session_end"));
  }
  var OKEYS = ["id", "date", "created", "updated", "stage", "pay", "method", "name", "phone", "delivery", "address", "note", "ref", "lang", "items", "discount", "fee", "due", "tracking", "web", "slip", "log"];
  function orderSig(o) { return JSON.stringify(OKEYS.map(function (k) { return o[k] == null ? "" : o[k]; })); }
  function syncDone(ok) {
    SYNC.busy = false;
    SYNC.state = ok ? "ok" : "err";
    if (ok) SYNC.at = Date.now();
    if (tab === "online" && !document.body.classList.contains("locked")) softRender(); else renderHead();
    if (ok && SYNC.push) { SYNC.push = false; pushOrders(); }
    else if (ok && SYNC.pull) { SYNC.pull = false; pullOrders(); }
  }
  function softRender() {
    var f = document.activeElement;
    // don't wipe a search box or form the admin is typing in; refresh on the next page change
    if (f && f.closest && f.closest("#adMain") && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) { pendingRender = true; renderHead(); if (DR) renderDrawer(); return; }
    render();
  }
  function pullOrders() {
    if (!ONLINE || !TOKEN) return;
    if (SYNC.busy) { SYNC.pull = true; return; }
    SYNC.busy = true;
    api("orders").then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "error");
      SYNC.sheet = res.sheet || SYNC.sheet;
      var server = res.orders.map(normalizeOrder), onServer = {}, mine = {}, changed = false, fresh = 0;
      server.forEach(function (o) { onServer[o.id] = o; });
      orders.forEach(function (o) { mine[o.id] = o; });
      var next = [];
      server.forEach(function (s) {
        var m = mine[s.id];
        if (!m) { next.push(s); changed = true; if (SYNC.ready && s.web) fresh++; }
        else if ((s.updated || "") > (m.updated || "")) { next.push(s); changed = true; }
        else next.push(m);
      });
      orders.forEach(function (m) {
        if (onServer[m.id]) return;
        if (SYNC.snap[m.id]) { changed = true; return; } // deleted on another device
        next.push(m); // added here and not sent yet
      });
      orders = next;
      SYNC.snap = {};
      server.forEach(function (o) { SYNC.snap[o.id] = orderSig(o); });
      store("minise_orders", orders);
      SYNC.ready = true;
      if (fresh) notifyNew(fresh);
      if (changed) softRender();
      if (orders.some(function (o) { return SYNC.snap[o.id] !== orderSig(o); })) SYNC.push = true;
      syncDone(true);
    }).catch(function () { syncDone(false); });
  }
  function pushOrders() {
    if (!ONLINE || !TOKEN) return;
    if (SYNC.busy) { SYNC.push = true; return; }
    var sent = {};
    var changedList = orders.filter(function (o) { return SYNC.snap[o.id] !== orderSig(o); });
    var gone = Object.keys(SYNC.snap).filter(function (id) { return !orderById(id); });
    if (!changedList.length && !gone.length) return;
    SYNC.busy = true;
    changedList.forEach(function (o) { sent[o.id] = orderSig(o); });
    var jobs = [];
    if (changedList.length) jobs.push(api("saveOrders", { orders: changedList }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "error");
      res.orders.forEach(function (r) {
        var n = normalizeOrder(r), cur = orderById(n.id);
        SYNC.snap[n.id] = orderSig(n);
        // take the saved copy unless the order was edited again while it was being sent
        if (cur && orderSig(cur) === sent[n.id]) orders[orders.indexOf(cur)] = n;
      });
    }));
    if (gone.length) jobs.push(api("deleteOrders", { ids: gone }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "error");
      gone.forEach(function (id) { delete SYNC.snap[id]; });
    }));
    Promise.all(jobs).then(function () {
      store("minise_orders", orders);
      if (DR) renderDrawer();
      syncDone(true);
    }).catch(function () { syncDone(false); });
  }
  function notifyNew(n) {
    NEWCOUNT += n;
    toast(a("new_web_orders", { n: n }), 6000);
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      var ctx = notifyNew.ctx || (notifyNew.ctx = new C());
      if (ctx.state === "suspended") ctx.resume();
      [880, 1320].forEach(function (f, i) {
        var osc = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + i * 0.16;
        osc.type = "sine"; osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        osc.connect(g); g.connect(ctx.destination); osc.start(t0); osc.stop(t0 + 0.55);
      });
    } catch (e) { /* sound is optional */ }
  }
  function applyCatalog(data) {
    products = data.products || products;
    settings = Object.assign(settings, data.settings || {});
    while (settings.ann.length < 3) settings.ann.push(["", ""]);
    if (!settings.templates) settings.templates = {};
    settings.api = API;
  }
  function loadCatalogOnline() {
    return api("catalog").then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "error");
      if (res.empty) return publishOnline(true);
      if (res.data && !dirty) { applyCatalog(res.data); SYNC.version = res.version; render(); }
    }).catch(function () { SYNC.state = "err"; renderHead(); });
  }
  function publishOnline(first) {
    var btn = document.getElementById("saveBtn");
    btn.disabled = true;
    settings.api = API;
    return api("publish", { products: products, settings: settings }).then(function (res) {
      btn.disabled = false;
      if (!res || !res.ok) throw new Error((res && res.error) || "error");
      applyCatalog(res);
      SYNC.version = res.version;
      afterSaved(); render();
      toast(first ? a("first_publish") : a("published"), 5000);
    }).catch(function (e) {
      btn.disabled = false;
      renderHead();
      toast(a("publish_fail", { e: e && e.message ? e.message : e }), 8000);
    });
  }
  function connectOnline(url) {
    var msg = document.getElementById("onMsg");
    var say = function (txt, ok) { msg.textContent = txt; msg.className = "alert " + (ok ? "ok" : "warn"); msg.hidden = false; };
    url = String(url || "").trim();
    if (!/^https:\/\/script\.google(usercontent)?\.com\/\S+$/.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/\S*$/.test(url)) { say(a("on_bad_url")); return; }
    say(a("on_checking"), true);
    fetch(url).then(function (r) { return r.json(); }).then(function (res) {
      if (!res || res.app !== "minise") throw new Error("no");
      store("minise_api", url);
      say(a("on_connected_toast"), true);
      dirty = 0;
      setTimeout(function () { location.reload(); }, 900);
    }).catch(function () { say(a("on_no_answer")); });
  }
  function showSlip(id) {
    var box = document.getElementById("slipBox");
    if (!box) return;
    if (SLIPS[id]) { box.innerHTML = '<img class="slip-img" src="' + SLIPS[id] + '" alt="' + esc(a("sec_slip")) + '">'; return; }
    box.innerHTML = '<p class="hint">' + esc(a("slip_loading")) + "</p>";
    api("slip", { id: id }).then(function (res) {
      if (!res || !res.ok) throw new Error("no");
      SLIPS[id] = res.data;
      var b = document.getElementById("slipBox");
      if (b) b.innerHTML = '<img class="slip-img" src="' + res.data + '" alt="' + esc(a("sec_slip")) + '">';
    }).catch(function () {
      var b = document.getElementById("slipBox");
      if (b) b.innerHTML = '<p class="alert warn">' + esc(a("slip_fail")) + "</p>";
    });
  }
  function saveOrdersToFolder() {
    if (!dir) return Promise.resolve();
    return dir.getDirectoryHandle("admin-data", { create: true }).then(function (d) {
      return writeFile(d, "orders.json", JSON.stringify(orders, null, 2));
    }).catch(function () { /* backup only */ });
  }
  function loadOrdersFromFolder() {
    if (!dir) return Promise.resolve();
    return dir.getDirectoryHandle("admin-data").then(function (d) { return d.getFileHandle("orders.json"); })
      .then(function (fh) { return fh.getFile(); }).then(function (f) { return f.text(); })
      .then(function (txt) {
        var fromFile = JSON.parse(txt);
        if (!Array.isArray(fromFile)) return;
        var byId = {};
        orders.concat(fromFile.map(normalizeOrder)).forEach(function (o) {
          var have = byId[o.id];
          if (!have || (o.updated || "") > (have.updated || "")) byId[o.id] = o;
        });
        orders = Object.keys(byId).map(function (k) { return byId[k]; });
        store("minise_orders", orders);
      }).catch(function () { /* no backup yet */ });
  }

  /* ---------- shell ---------- */
  var NAV = [
    { tab: "dashboard", icon: "dashboard" },
    { h: "grp_sales" }, { tab: "orders", icon: "orders", badge: true }, { tab: "customers", icon: "customers" },
    { h: "grp_catalog" }, { tab: "products", icon: "products" }, { tab: "stock", icon: "stock" },
    { h: "grp_settings" }, { tab: "shop", icon: "shop" }, { tab: "online", icon: "cloud" }, { tab: "messages", icon: "messages" }, { tab: "backup", icon: "backup" }, { tab: "account", icon: "account" }
  ];
  function renderNav() {
    var waiting = orders.filter(function (o) { return o.stage === "new" || o.pay === "paid"; }).length;
    document.getElementById("sideNav").innerHTML = NAV.map(function (n) {
      if (n.h) return '<p class="side-h">' + esc(a(n.h)) + "</p>";
      return '<button type="button" class="side-item' + (n.tab === tab ? " on" : "") + '" data-tab="' + n.tab + '"' + (n.tab === tab ? ' aria-current="page"' : "") + ">" +
        icon(n.icon) + "<span>" + esc(a("nav_" + n.tab)) + "</span>" + (n.badge && waiting ? '<span class="badge-n">' + waiting + "</span>" : "") + "</button>";
    }).join("");
  }
  function renderHead() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-a]").forEach(function (el) { el.textContent = a(el.getAttribute("data-a")); });
    document.querySelectorAll("[data-icon]").forEach(function (el) { if (!el.firstChild) el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[el.getAttribute("data-icon")] + "</svg>"; });
    document.getElementById("adLangLabel").textContent = a("lang_switch");
    var st = document.getElementById("folderStatus");
    var sb = document.getElementById("saveBtn");
    if (ONLINE) {
      st.className = "side-status" + (SYNC.state === "ok" ? " ok" : SYNC.state === "err" ? " err" : "");
      st.textContent = SYNC.state === "ok" ? a("on_status_ok", { t: fmtTime(SYNC.at) }) : SYNC.state === "err" ? a("on_status_err") : a("on_status_wait");
      document.getElementById("connectBtn").hidden = true;
      sb.textContent = dirty ? a("publish_n", { n: dirty }) : a("published_all");
      sb.disabled = !dirty;
    } else {
      st.className = "side-status" + (dir ? " ok" : "");
      st.textContent = dir ? a("connected", { n: dir.name }) : a("not_connected");
      document.getElementById("connectLabel").textContent = !dir && savedDir ? a("reconnect") : a("connect");
      document.getElementById("connectBtn").hidden = !!dir;
      sb.textContent = dirty ? a("save_n", { n: dirty }) : (dir ? a("saved_all") : a("save"));
      sb.disabled = !dirty && !!dir;
    }
    document.getElementById("pageTitle").textContent = a("nav_" + tab);
    document.getElementById("pageSub").textContent = a("sub_" + tab, { n: products.length });
    document.getElementById("gq").placeholder = a("search_ph");
    document.title = (NEWCOUNT ? "(" + NEWCOUNT + ") " : "") + a("nav_" + tab) + " · Minise Admin";
    renderNav();
  }
  function fmtTime(ms) { try { return new Date(ms).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  function render() {
    pendingRender = false;
    if (tab === "orders") NEWCOUNT = 0;
    renderHead();
    var pages = { dashboard: dashboardPage, orders: ordersPage, customers: customersPage, products: productsPage, stock: stockPage, shop: shopPage, online: onlinePage, messages: messagesPage, backup: backupPage, account: accountPage };
    document.getElementById("adMain").innerHTML = (pages[tab] || dashboardPage)();
    if (tab === "orders") renderOrderTable();
    if (tab === "customers") renderCustomerTable();
    if (tab === "products") renderProductTable();
    if (tab === "stock") renderStockTable();
    if (DR) renderDrawer();
  }
  function go(t) {
    tab = t; history.replaceState(null, "", "#" + t); closeDrawer(); render(); window.scrollTo(0, 0);
    // fade the new page in; the class comes off again so later refreshes don't replay it
    var m = document.getElementById("adMain");
    m.classList.remove("page-in"); void m.offsetWidth; m.classList.add("page-in");
    clearTimeout(go._t); go._t = setTimeout(function () { m.classList.remove("page-in"); }, 800);
  }

  /* ---------- pills ---------- */
  function stPill(s) { return '<span class="pill st-' + s + '">' + esc(a("st_" + s)) + "</span>"; }
  function payPill(p) { return '<span class="pill pay-' + p + '">' + esc(a("pay_" + p)) + "</span>"; }
  function duePill(o) {
    if (!o.due) return "";
    if (o.stage === "sent" || o.stage === "done") return '<span class="pill muted">' + esc(fmtDate(o.due)) + "</span>";
    var d = daysBetween(todayISO(), o.due);
    if (d < 0) return '<span class="pill due-over">' + esc(a("due_over")) + "</span>";
    if (d === 0) return '<span class="pill due-today">' + esc(a("due_today")) + "</span>";
    if (d === 1) return '<span class="pill due-soon">' + esc(a("due_tomorrow")) + "</span>";
    return '<span class="pill muted">' + esc(fmtDate(o.due)) + "</span>";
  }

  /* ---------- dashboard ---------- */
  function setPreset(p) {
    var now = new Date(), from = new Date(now);
    DF.preset = p;
    if (p === "week") from.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    else if (p === "month") from = new Date(now.getFullYear(), now.getMonth(), 1);
    if (p === "all") {
      var ds = orders.map(function (o) { return o.date; }).filter(Boolean).sort();
      DF.from = ds[0] || isoDate(now);
      DF.to = ds.length && ds[ds.length - 1] > isoDate(now) ? ds[ds.length - 1] : isoDate(now);
    } else { DF.from = isoDate(from); DF.to = isoDate(now); }
  }
  setPreset("today");
  function inRange(o) { return o.date >= DF.from && o.date <= DF.to; }
  function salesCard(paid) {
    var buckets = [], title;
    if (DF.from === DF.to) {
      title = a("c_sales_hour");
      var hours = paid.map(function (o) { return new Date(o.created).getHours(); });
      var lo = Math.min.apply(null, [9].concat(hours)), hi = Math.max.apply(null, [18].concat(hours));
      for (var h = lo; h <= hi; h++) buckets.push({ key: h, label: pad2(h), v: 0 });
      paid.forEach(function (o, i) { var b = buckets[hours[i] - lo]; if (b) b.v += orderTotal(o); });
    } else {
      var days = daysBetween(DF.from, DF.to) + 1;
      if (days <= 62) {
        title = a("c_sales_day");
        for (var d = 0; d < days; d++) { var k = addDays(DF.from, d); buckets.push({ key: k, label: +k.slice(8) + "/" + +k.slice(5, 7), v: 0 }); }
        paid.forEach(function (o) { var b = buckets.find(function (x) { return x.key === o.date; }); if (b) b.v += orderTotal(o); });
      } else {
        title = a("c_sales_month");
        var cur = DF.from.slice(0, 7);
        while (cur <= DF.to.slice(0, 7)) {
          buckets.push({ key: cur, label: +cur.slice(5) + "/" + cur.slice(2, 4), v: 0 });
          var y = +cur.slice(0, 4), m = +cur.slice(5) + 1; if (m > 12) { m = 1; y++; }
          cur = y + "-" + pad2(m);
        }
        paid.forEach(function (o) { var b = buckets.find(function (x) { return x.key === o.date.slice(0, 7); }); if (b) b.v += orderTotal(o); });
      }
    }
    var max = Math.max.apply(null, buckets.map(function (b) { return b.v; }).concat([0]));
    var body = !max ? '<p class="empty">' + esc(a("c_sales_empty")) + "</p>" :
      '<div class="bars' + (buckets.length > 16 ? " dense" : "") + '">' + buckets.map(function (b) {
        return '<div class="bar' + (b.v ? "" : " zero") + '" title="' + esc(b.label + ": " + money(b.v)) + '"><div class="col"><i style="height:' + (b.v ? Math.max(3, Math.round(b.v / max * 100)) : 2) + '%"></i></div><span>' + esc(b.label) + "</span></div>";
      }).join("") + "</div>";
    return '<section class="card"><div class="card-head"><h2>' + esc(title) + "</h2></div>" + body + "</section>";
  }
  function bestCard(paid) {
    var agg = {};
    paid.forEach(function (o) {
      o.items.forEach(function (it) {
        var key = it.name;
        if (DF.by === "category") { var p = findProduct(it.name); key = p ? typeName(p.t[0]) : a("other"); }
        if (!agg[key]) agg[key] = { q: 0, v: 0 };
        agg[key].q += it.qty || 1; agg[key].v += it.price || 0;
      });
    });
    var list = Object.keys(agg).map(function (k) { return { k: k, q: agg[k].q, v: agg[k].v }; }).sort(function (x, y) { return (y.q - x.q) || (y.v - x.v); }).slice(0, 7);
    var seg = '<div class="seg small"><button type="button" data-bestby="product" class="' + (DF.by === "product" ? "on" : "") + '">' + esc(a("by_product")) + '</button><button type="button" data-bestby="category" class="' + (DF.by === "category" ? "on" : "") + '">' + esc(a("by_category")) + "</button></div>";
    var body = list.length ? "<div>" + list.map(function (r, i) {
      return '<div class="rank"><span class="n">' + (i + 1) + '</span><span class="nm">' + esc(r.k) + '</span><span class="q">' + esc(a("sold_n", { n: r.q })) + "</span><b>" + esc(money(r.v)) + "</b></div>";
    }).join("") + "</div>" : '<p class="empty">' + esc(a("best_empty")) + "</p>";
    return '<section class="card"><div class="card-head"><h2>' + esc(a("c_best_h")) + "</h2>" + seg + "</div>" + body + '<p class="hint">' + esc(a("paid_only")) + "</p></section>";
  }
  function methodsCard(paid) {
    var rows = METHODS.map(function (m) {
      var list = paid.filter(function (o) { return o.method === m; });
      return { m: m, n: list.length, v: list.reduce(function (s, o) { return s + orderTotal(o); }, 0) };
    }).filter(function (r) { return r.n; });
    var max = Math.max.apply(null, rows.map(function (r) { return r.v; }).concat([1]));
    var body = rows.length ? "<div>" + rows.map(function (r) {
      return '<div class="mrow"><div class="top-line"><span>' + esc(a("m_" + r.m)) + ' <small class="hint">· ' + esc(a("orders_n", { n: r.n })) + "</small></span><b>" + esc(money(r.v)) + '</b></div><div class="meter"><i style="width:' + Math.max(2, Math.round(r.v / max * 100)) + '%"></i></div></div>';
    }).join("") + "</div>" : '<p class="empty">' + esc(a("methods_empty")) + "</p>";
    return '<section class="card"><div class="card-head"><h2>' + esc(a("c_methods_h")) + "</h2></div>" + body + "</section>";
  }
  function attentionCard() {
    var c = function (f) { return orders.filter(f).length; };
    var rows = [
      [a("st_new"), c(function (o) { return o.stage === "new"; }), "orders:new", true],
      [a("o_check"), c(function (o) { return o.pay === "paid"; }), "orders:check", true],
      [a("st_making"), c(function (o) { return o.stage === "making"; }), "orders:making"],
      [a("st_ready"), c(function (o) { return o.stage === "ready"; }), "orders:ready"],
      [a("p_soldout"), products.filter(function (p) { return p.so; }).length, "stock:so"],
      [a("p_noprice"), products.filter(function (p) { return !p.o.length && !p.hid; }).length, "products:noprice"]
    ];
    return '<section class="card"><div class="card-head"><h2>' + esc(a("c_attention_h")) + '</h2></div><div class="rows">' + rows.map(function (r) {
      return '<button type="button" class="r" data-goto="' + r[2] + '"><span>' + esc(r[0]) + "</span><b" + (r[1] && r[3] ? ' class="alert"' : "") + ">" + r[1] + "</b></button>";
    }).join("") + "</div></section>";
  }
  function recentCard() {
    var list = orders.slice().sort(function (x, y) { return y.created.localeCompare(x.created); }).slice(0, 6);
    var body = list.length ? '<table class="tbl"><tbody>' + list.map(function (o) {
      return '<tr class="click" data-open="' + esc(o.id) + '"><td><span class="oid">' + esc(o.id) + "</span><small>" + esc(fmtDate(o.date)) + "</small></td><td><b>" + esc(o.name || "—") + '</b></td><td class="num">' + esc(money(orderTotal(o))) + "</td><td>" + stPill(o.stage) + "</td></tr>";
    }).join("") + "</tbody></table>" : '<p class="empty" style="padding:0 20px 18px">' + esc(a("recent_empty")) + "</p>";
    return '<section class="card flush"><div class="card-head"><h2>' + esc(a("c_recent_h")) + '</h2><button type="button" class="link" data-goto="orders:all">' + esc(a("view_all")) + "</button></div>" + body + "</section>";
  }
  function dueCard() {
    var limit = addDays(todayISO(), 7);
    var list = orders.filter(function (o) { return o.due && o.stage !== "sent" && o.stage !== "done" && o.due <= limit; }).sort(function (x, y) { return x.due.localeCompare(y.due); }).slice(0, 6);
    var body = list.length ? '<table class="tbl"><tbody>' + list.map(function (o) {
      return '<tr class="click" data-open="' + esc(o.id) + '"><td><span class="oid">' + esc(o.id) + "</span><small>" + esc(o.name) + "</small></td><td>" + stPill(o.stage) + '</td><td class="num">' + duePill(o) + "</td></tr>";
    }).join("") + "</tbody></table>" : '<p class="empty" style="padding:0 20px 18px">' + esc(a("due_empty")) + "</p>";
    return '<section class="card flush"><div class="card-head"><h2>' + esc(a("c_due_h")) + "</h2></div>" + body + "</section>";
  }
  function dashboardPage() {
    var inP = orders.filter(inRange), paid = inP.filter(isPaid);
    var collected = paid.reduce(function (s, o) { return s + orderTotal(o); }, 0);
    var avg = paid.length ? Math.round(collected / paid.length) : 0;
    var open = orders.filter(function (o) { return !isPaid(o) && o.stage !== "done"; });
    var openSum = open.reduce(function (s, o) { return s + orderTotal(o); }, 0);
    var seg = '<div class="seg">' + ["today", "week", "month", "all"].map(function (p) {
      return '<button type="button" data-period="' + p + '" class="' + (DF.preset === p ? "on" : "") + '">' + esc(a("period_" + p)) + "</button>";
    }).join("") + "</div>";
    var dates = '<div class="dates"><input type="date" id="dfFrom" value="' + DF.from + '" aria-label="' + esc(a("date_from")) + '"><span>–</span><input type="date" id="dfTo" value="' + DF.to + '" aria-label="' + esc(a("date_to")) + '"></div>';
    var kpis = [
      ["money", a("k_collected"), money(collected), a("k_collected_c")],
      ["cart", a("k_orders"), String(inP.length), a("k_orders_c")],
      ["avg", a("k_avg"), money(avg), a("k_avg_c")],
      ["clock", a("k_open"), money(openSum), open.length ? a("k_open_n", { n: open.length }) : a("k_open_c")]
    ];
    return '<div class="dash-bar">' + seg + dates + "</div>" +
      '<div class="kpis">' + kpis.map(function (k) { return '<div class="kpi"><span class="l">' + icon(k[0]) + esc(k[1]) + "</span><b>" + esc(k[2]) + '</b><span class="c">' + esc(k[3]) + "</span></div>"; }).join("") + "</div>" +
      '<div class="cards two">' + salesCard(paid) + bestCard(paid) + "</div>" +
      '<div class="cards even">' + recentCard() + dueCard() + "</div>" +
      '<div class="cards even">' + methodsCard(paid) + attentionCard() + "</div>";
  }

  /* ---------- orders ---------- */
  function oFiltered() {
    var q = OF.q.trim().toLowerCase(), qd = phoneDigits(q);
    return orders.filter(function (o) {
      if (OF.stage === "check") { if (o.pay !== "paid") return false; }
      else if (OF.stage !== "all" && o.stage !== OF.stage) return false;
      if (OF.pay !== "all" && o.pay !== OF.pay) return false;
      if (OF.method !== "all" && o.method !== OF.method) return false;
      if (q) {
        var hay = (o.id + " " + o.name + " " + o.phone + " " + o.items.map(function (it) { return it.name; }).join(" ")).toLowerCase();
        var phoneHit = qd.length >= 4 && phoneDigits(o.phone).indexOf(qd) > -1;
        if (hay.indexOf(q) < 0 && !phoneHit) return false;
      }
      return true;
    }).sort(function (x, y) { return ((x.stage === "done") - (y.stage === "done")) || y.created.localeCompare(x.created); });
  }
  function ordersPage() {
    var cnt = function (f) { return orders.filter(f).length; };
    var tabs = [["all", a("o_all"), orders.length]]
      .concat(STAGES.map(function (s) { return [s, a("st_" + s), cnt(function (o) { return o.stage === s; })]; }))
      .concat([["check", a("o_check"), cnt(function (o) { return o.pay === "paid"; })]]);
    return '<div class="toolbar"><div class="seg">' + tabs.map(function (tb) { return '<button type="button" data-ostage="' + tb[0] + '" class="' + (OF.stage === tb[0] ? "on" : "") + '">' + esc(tb[1]) + '<span class="n">' + tb[2] + "</span></button>"; }).join("") + "</div></div>" +
      '<div class="toolbar"><input type="search" id="oq" placeholder="' + esc(a("o_search")) + '" value="' + esc(OF.q) + '" aria-label="' + esc(a("o_search")) + '">' +
      '<select id="opay" aria-label="' + esc(a("col_payment")) + '"><option value="all">' + esc(a("pay_all")) + "</option>" + PAYS.map(function (p) { return '<option value="' + p + '"' + (OF.pay === p ? " selected" : "") + ">" + esc(a("pay_" + p)) + "</option>"; }).join("") + "</select>" +
      '<select id="omethod" aria-label="' + esc(a("f_channel")) + '"><option value="all">' + esc(a("m_all")) + "</option>" + METHODS.map(function (m) { return '<option value="' + m + '"' + (OF.method === m ? " selected" : "") + ">" + esc(a("m_" + m)) + "</option>"; }).join("") + "</select>" +
      '<button class="btn ghost" type="button" id="pasteToggle">' + icon("paste") + esc(a("o_paste_toggle")) + "</button>" +
      '<button class="btn ghost" type="button" id="exportCsv">' + icon("download") + esc(a("o_export")) + "</button>" +
      '<button class="btn" type="button" id="addOrder">' + icon("plus") + esc(a("o_add")) + "</button></div>" +
      '<div class="paste" id="pasteBox"' + (orders.length ? " hidden" : "") + '><label for="pasteMsg"><b>' + esc(a("o_paste_h")) + '</b></label><textarea id="pasteMsg" placeholder="' + esc(a("o_paste_ph")) + '"></textarea><div><button class="btn" type="button" id="pasteBtn">' + esc(a("o_paste_btn")) + "</button></div></div>" +
      '<div class="bulk" id="bulk" hidden></div>' +
      '<div class="table-wrap" id="otable"></div>' +
      (dir ? "" : '<p class="hint">' + esc(a("o_local")) + "</p>");
  }
  function renderOrderTable() {
    var list = oFiltered();
    var allSel = list.length && list.every(function (o) { return SEL[o.id]; });
    var box = document.getElementById("otable");
    if (!box) return;
    if (!list.length) {
      box.innerHTML = '<div class="empty-state">' + icon("orders") + "<p>" + esc(orders.length ? a("o_none") : a("o_none_all")) + "</p></div>";
    } else {
      box.innerHTML = '<table class="tbl"><thead><tr><th class="cb"><input type="checkbox" id="selAll"' + (allSel ? " checked" : "") + ' aria-label="' + esc(a("select_all")) + '"></th><th>' + esc(a("col_order")) + "</th><th>" + esc(a("col_customer")) + "</th><th>" + esc(a("col_items")) + '</th><th class="num">' + esc(a("col_total")) + "</th><th>" + esc(a("col_payment")) + "</th><th>" + esc(a("col_status")) + "</th><th>" + esc(a("col_due")) + "</th></tr></thead><tbody>" +
        list.map(function (o) {
          var first = o.items[0] ? o.items[0].name : "—";
          var sub = o.items.length > 1 ? a("more_items", { n: o.items.length - 1 }) : (o.items[0] && o.items[0].details) || "";
          return '<tr class="click' + (SEL[o.id] ? " sel" : "") + '" data-open="' + esc(o.id) + '"><td class="cb"><input type="checkbox" data-sel="' + esc(o.id) + '"' + (SEL[o.id] ? " checked" : "") + ' aria-label="' + esc(o.id) + '"></td>' +
            '<td><span class="oid">' + esc(o.id) + "</span><small>" + esc(fmtDate(o.date)) + " · " + esc(a("m_" + o.method)) + (o.web ? " · " + esc(a("web_badge")) : "") + "</small></td>" +
            "<td><b>" + esc(o.name || "—") + "</b><small>" + esc(o.phone) + "</small></td>" +
            "<td>" + esc(first) + "<small>" + esc(sub) + "</small></td>" +
            '<td class="num"><b>' + esc(money(orderTotal(o))) + "</b>" + (hasUnknown(o) ? "<small>" + esc(a("to_price")) + "</small>" : "") + "</td>" +
            "<td>" + payPill(o.pay) + "</td><td>" + stPill(o.stage) + "</td><td>" + duePill(o) + "</td></tr>";
        }).join("") + "</tbody></table>";
    }
    renderBulk();
  }
  function renderBulk() {
    var bar = document.getElementById("bulk");
    if (!bar) return;
    var ids = Object.keys(SEL).filter(function (id) { return SEL[id] && orderById(id); });
    bar.hidden = !ids.length;
    if (!ids.length) return;
    bar.innerHTML = "<b>" + esc(a("bulk_sel", { n: ids.length })) + "</b>" +
      '<button class="btn sm" type="button" data-bulk="paid">' + icon("check") + esc(a("act_paid")) + "</button>" +
      ["making", "ready", "sent", "done"].map(function (s) { return '<button class="btn sm" type="button" data-bulk="' + s + '">' + esc(a("st_" + s)) + "</button>"; }).join("") +
      '<span class="grow"></span><button class="btn sm" type="button" data-bulk="clear">' + esc(a("bulk_clear")) + "</button>";
  }
  function logEvent(o, what) { o.log.push({ at: new Date().toISOString(), what: what }); o.updated = new Date().toISOString(); }
  function setStage(o, s) { if (o.stage === s) return; o.stage = s; logEvent(o, a("log_stage", { s: a("st_" + s) })); }
  function customerMsg(o) {
    var key = o.pay === "unpaid" && o.stage === "new" ? "pay" : o.stage;
    var tpl = settings.templates[key] && settings.templates[key][lang === "lo" ? 1 : 0];
    if (!tpl) tpl = a("msg_" + key);
    if (!o.tracking) tpl = tpl.replace(/[^.!?]*\{tracking\}[^.!?]*[.!?]?\s*/g, "");
    var vars = { name: o.name || "", id: o.id, total: money(orderTotal(o)), delivery: o.delivery || "", account: settings.account || "", tracking: o.tracking || "" };
    Object.keys(vars).forEach(function (k) { tpl = tpl.split("{" + k + "}").join(vars[k]); });
    return tpl.replace(/\s{2,}/g, " ").trim();
  }

  /* order side panel */
  function openDrawer(id) {
    if (!orderById(id)) return;
    DR = { id: id, ask: false, menu: false };
    document.getElementById("scrim").hidden = false;
    document.getElementById("drawer").hidden = false;
    renderDrawer();
    var c = document.querySelector("#drawer [data-closedr]"); if (c) c.focus();
  }
  function closeDrawer() {
    DR = null;
    document.getElementById("scrim").hidden = true;
    document.getElementById("drawer").hidden = true;
  }
  function renderDrawer() {
    var o = DR && orderById(DR.id);
    if (!o) { closeDrawer(); return; }
    var si = STAGES.indexOf(o.stage), wa = intlPhone(o.phone);
    var steps = STAGES.map(function (s, i) { return '<li class="' + (i < si ? "done" : i === si ? "now" : "") + '"><span></span>' + esc(a("st_" + s)) + "</li>"; }).join("");
    var acts = [];
    if (NEXT[o.stage]) acts.push('<button class="btn" type="button" data-dact="next">' + esc(a("act_" + NEXT[o.stage])) + icon("arrow") + "</button>");
    if (o.pay === "unpaid") acts.push('<button class="btn ghost" type="button" data-dact="paid">' + icon("check") + esc(a("act_paid")) + "</button>");
    else if (o.pay === "paid") acts.push('<button class="btn ghost" type="button" data-dact="checked">' + icon("check") + esc(a("act_checked")) + "</button>");
    if (wa) acts.push('<a class="btn ghost" href="https://wa.me/' + wa + "?text=" + encodeURIComponent(customerMsg(o)) + '" target="_blank" rel="noopener">' + icon("chat") + esc(a("act_msg")) + "</a>");
    acts.push('<div class="more"><button class="btn ghost" type="button" data-dact="menu" aria-expanded="' + !!DR.menu + '">' + icon("more") + esc(a("act_more")) + "</button>" +
      (DR.menu ? '<div class="more-menu"><button type="button" data-dact="inv">' + icon("printer") + esc(a("act_print_inv")) + '</button><button type="button" data-dact="slip">' + icon("printer") + esc(a("act_print_slip")) + '</button><button type="button" data-dact="edit">' + icon("edit") + esc(a("act_edit")) + '</button><button type="button" data-dact="dup">' + icon("copy") + esc(a("act_dup")) + "</button>" +
        (si > 0 ? '<button type="button" data-dact="back">' + icon("undo") + esc(a("act_back")) + "</button>" : "") + '<button type="button" class="danger" data-dact="delete">' + icon("trash") + esc(a("act_delete")) + "</button></div>" : "") + "</div>");
    var items = o.items.map(function (it) {
      var p = findProduct(it.name);
      return '<div class="oitem">' + (p && p.img[0] ? '<img src="' + esc(p.img[0]) + '" alt="">' : '<span class="noimg"></span>') +
        '<div class="nm"><b>' + esc(it.name) + "</b>" + (it.details ? "<small>" + esc(it.details) + "</small>" : "") + '</div><span class="q">× ' + (it.qty || 1) + '</span><span class="pz">' + (it.price ? esc(money(it.price)) : '<span class="ask">' + esc(a("to_price")) + "</span>") + "</span></div>";
    }).join("");
    var hist = o.log.slice().reverse().map(function (l) { return "<li><time>" + esc(fmtWhen(l.at)) + "</time>" + esc(l.k ? a("log_" + l.k) : l.what) + "</li>"; }).join("");
    document.getElementById("drawer").innerHTML =
      '<div class="dr-head"><div class="dr-top"><div><h2>' + esc(o.id) + "</h2><p>" + esc(fmtWhen(o.created)) + " · " + esc(a("m_" + o.method)) + (o.web ? " · " + esc(a("web_badge")) : "") + '</p></div><button class="icon-btn" type="button" data-closedr aria-label="' + esc(a("close")) + '">' + icon("x") + "</button></div>" +
      '<div class="dr-pills">' + payPill(o.pay) + stPill(o.stage) + duePill(o) + "</div>" +
      '<ol class="stepper">' + steps + "</ol>" +
      '<div class="dr-actions">' + acts.join("") + "</div>" +
      (DR.ask ? '<div class="track-ask"><label for="trackIn"><b>' + esc(a("track_label")) + '</b></label><div class="row"><input type="text" id="trackIn" value="' + esc(o.tracking) + '"><button class="btn" type="button" data-dact="confirmSent">' + esc(a("track_confirm")) + '</button><button class="btn ghost" type="button" data-dact="cancelSent">' + esc(a("cancel")) + "</button></div></div>" : "") +
      "</div>" +
      '<div class="dr-body">' +
      '<section class="dr-sec"><h3>' + esc(a("sec_customer")) + '</h3><div class="cust-line"><b>' + esc(o.name || "—") + "</b>" + (o.phone ? '<span class="num">' + esc(o.phone) + "</span>" : "") +
      (wa ? '<a class="btn ghost sm" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + icon("chat") + "WhatsApp</a>" : "") +
      (o.phone ? '<a class="btn ghost sm" href="tel:' + esc(String(o.phone).replace(/[^\d+]/g, "")) + '">' + icon("phone") + esc(a("act_call")) + "</a>" : "") + "</div>" +
      '<dl class="kv"><dt>' + esc(a("f_delivery")) + "</dt><dd>" + esc(o.delivery || "—") + "</dd>" + (o.address ? "<dt>" + esc(a("f_address")) + "</dt><dd>" + esc(o.address) + "</dd>" : "") + "</dl></section>" +
      '<section class="dr-sec"><h3>' + esc(a("sec_items")) + '</h3><div class="oitems">' + (items || '<p class="empty">—</p>') + "</div>" +
      '<div class="sum"><div><span>' + esc(a("subtotal")) + "</span><span>" + esc(money(orderSub(o))) + "</span></div>" +
      (o.discount ? "<div><span>" + esc(a("discount")) + "</span><span>− " + esc(money(o.discount)) + "</span></div>" : "") +
      (o.fee ? "<div><span>" + esc(a("fee")) + "</span><span>" + esc(money(o.fee)) + "</span></div>" : "") +
      '<div class="total"><span>' + esc(a("total")) + "</span><span>" + esc(money(orderTotal(o))) + "</span></div>" +
      (hasUnknown(o) ? '<p class="hint">' + esc(a("plus_unknown")) + "</p>" : "") + "</div></section>" +
      '<section class="dr-sec"><h3>' + esc(a("sec_details")) + '</h3><dl class="kv"><dt>' + esc(a("f_channel")) + "</dt><dd>" + esc(a("m_" + o.method)) + "</dd><dt>" + esc(a("f_due")) + "</dt><dd>" + esc(o.due ? fmtDate(o.due) : "—") + "</dd><dt>" + esc(a("f_tracking")) + "</dt><dd>" + esc(o.tracking || "—") + "</dd>" + (o.ref ? "<dt>" + esc(a("f_ref")) + "</dt><dd>" + esc(o.ref) + "</dd>" : "") + "<dt>" + esc(a("f_created")) + "</dt><dd>" + esc(fmtWhen(o.created)) + "</dd></dl></section>" +
      (o.slip ? '<section class="dr-sec"><h3>' + esc(a("sec_slip")) + '</h3><div id="slipBox">' + (SLIPS[o.id] ? '<img class="slip-img" src="' + SLIPS[o.id] + '" alt="' + esc(a("sec_slip")) + '">' : '<button class="btn ghost sm" type="button" data-viewslip="' + esc(o.id) + '">' + icon("money") + esc(a("slip_view")) + "</button>") + "</div></section>" : "") +
      (o.note ? '<section class="dr-sec"><h3>' + esc(a("sec_note")) + '</h3><p class="note-box">' + esc(o.note) + "</p></section>" : "") +
      (hist ? '<section class="dr-sec"><h3>' + esc(a("sec_history")) + '</h3><ul class="hist">' + hist + "</ul></section>" : "") +
      "</div>";
    if (DR.ask) { var ti = document.getElementById("trackIn"); if (ti) ti.focus(); }
  }
  function drawerAction(act) {
    var o = orderById(DR.id); if (!o) return;
    if (act === "menu") { DR.menu = !DR.menu; renderDrawer(); return; }
    DR.menu = false;
    if (act === "next") {
      if (NEXT[o.stage] === "sent") { DR.ask = true; renderDrawer(); return; }
      setStage(o, NEXT[o.stage]);
    } else if (act === "confirmSent") {
      var tr = (document.getElementById("trackIn").value || "").trim();
      if (tr && tr !== o.tracking) { o.tracking = tr; logEvent(o, a("log_tracking", { t: tr })); }
      setStage(o, "sent"); DR.ask = false;
    } else if (act === "cancelSent") { DR.ask = false; renderDrawer(); return; }
    else if (act === "paid") { o.pay = "paid"; logEvent(o, a("log_paid")); }
    else if (act === "checked") { o.pay = "checked"; logEvent(o, a("log_checked")); }
    else if (act === "back") { var i = STAGES.indexOf(o.stage); if (i > 0) setStage(o, STAGES[i - 1]); }
    else if (act === "inv" || act === "slip") { renderDrawer(); printOrder(o, act); return; }
    else if (act === "edit") { renderDrawer(); openOrderEditor(o, false); return; }
    else if (act === "dup") {
      var copy = normalizeOrder(clone(o));
      copy.id = newOrderId(); copy.created = new Date().toISOString(); copy.date = todayISO(); copy.stage = "new"; copy.pay = "unpaid"; copy.tracking = ""; copy.log = [];
      logEvent(copy, a("log_created"));
      orders.push(copy); saveOrders(); DR.id = copy.id; render(); toast(a("o_saved")); return;
    } else if (act === "delete") {
      if (!confirm(a("o_del_confirm", { n: o.id }))) { renderDrawer(); return; }
      orders.splice(orders.indexOf(o), 1); delete SEL[o.id]; saveOrders(); closeDrawer(); render(); toast(a("o_deleted")); return;
    }
    saveOrders(); render();
    toast(act === "paid" || act === "checked" ? o.id + " · " + a("pay_" + o.pay) : a("toast_stage", { id: o.id, s: a("st_" + o.stage) }));
  }
  function bulkAction(act) {
    if (act === "clear") { SEL = {}; renderOrderTable(); return; }
    var n = 0;
    Object.keys(SEL).forEach(function (id) {
      var o = orderById(id); if (!o || !SEL[id]) return;
      if (act === "paid") { if (o.pay === "unpaid") { o.pay = "paid"; logEvent(o, a("log_paid")); n++; } }
      else if (o.stage !== act) { setStage(o, act); n++; }
    });
    SEL = {}; saveOrders(); render(); toast(a("bulk_done", { n: n }));
  }

  /* order editor */
  function newOrderId() {
    var d = new Date(), chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = "";
    for (var i = 0; i < 4; i++) r += chars[Math.floor(Math.random() * chars.length)];
    return "MA-" + String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "-" + r;
  }
  function blankOrder() { return normalizeOrder({ id: newOrderId(), date: todayISO(), created: new Date().toISOString(), items: [{ name: "", qty: 1, details: "", price: 0 }] }); }
  function itemRow(it) {
    return '<div class="itemrow"><input type="text" class="i-name" list="productNames" placeholder="' + esc(a("o_item")) + '" value="' + esc(it.name) + '" aria-label="' + esc(a("o_item")) + '">' +
      '<input type="text" class="i-qty" inputmode="numeric" value="' + (it.qty || 1) + '" aria-label="' + esc(a("o_qty")) + '">' +
      '<input type="text" class="i-det" placeholder="' + esc(a("o_details")) + '" value="' + esc(it.details) + '" aria-label="' + esc(a("o_details")) + '">' +
      '<input type="text" class="i-price" inputmode="numeric" placeholder="' + esc(a("o_line")) + '" value="' + (it.price ? Number(it.price).toLocaleString("en-US") : "") + '" aria-label="' + esc(a("o_line")) + '">' +
      '<button class="icon-btn" type="button" data-delrow aria-label="' + esc(a("e_remove")) + '">' + icon("x") + "</button></div>";
  }
  function openOrderEditor(o, isNew) {
    editingOrder = { o: clone(o), isNew: isNew, ref: isNew ? null : o };
    var x = editingOrder.o;
    var opt = function (vals, cur, pre) { return vals.map(function (v) { return '<option value="' + v + '"' + (v === cur ? " selected" : "") + ">" + esc(a(pre + v)) + "</option>"; }).join(""); };
    var f = function (id, label, val, type) { return '<div class="field"><label for="' + id + '">' + esc(label) + '</label><input type="' + (type || "text") + '" id="' + id + '" value="' + esc(val) + '"></div>'; };
    var dlg = document.getElementById("dlg");
    dlg.innerHTML = '<form id="oform" novalidate><div class="dlg-head"><h2>' + esc(isNew ? a("o_new_h") : a("o_edit_h", { id: x.id })) + '</h2><button class="icon-btn" type="button" data-closedlg aria-label="' + esc(a("close")) + '">' + icon("x") + "</button></div>" +
      '<div class="dlg-body"><p class="alert warn" id="oerr" hidden></p>' +
      '<div class="fs"><p class="legend">' + esc(a("sec_order")) + '</p><div class="grid3">' + f("o_id", a("o_no"), x.id) + f("o_date", a("o_date"), x.date, "date") +
      '<div class="field"><label for="o_method">' + esc(a("o_method")) + '</label><select id="o_method">' + opt(METHODS, x.method, "m_") + "</select></div></div>" +
      '<div class="grid3"><div class="field"><label for="o_pay">' + esc(a("o_pay")) + '</label><select id="o_pay">' + opt(PAYS, x.pay, "pay_") + "</select></div>" +
      '<div class="field"><label for="o_stage">' + esc(a("o_stage")) + '</label><select id="o_stage">' + opt(STAGES, x.stage, "st_") + "</select></div>" + f("o_due", a("o_due"), x.due, "date") + "</div></div>" +
      '<div class="fs"><p class="legend">' + esc(a("sec_customer")) + '</p><div class="grid2">' + f("o_name", a("o_name"), x.name) + f("o_phone", a("o_phone"), x.phone, "tel") + "</div>" +
      '<div class="grid2">' + f("o_delivery", a("o_delivery"), x.delivery) + f("o_address", a("o_address"), x.address) + "</div>" + f("o_tracking", a("o_tracking"), x.tracking) + "</div>" +
      '<div class="fs"><p class="legend">' + esc(a("sec_items")) + '</p><div id="itemRows" class="fs">' + x.items.map(itemRow).join("") + '</div><div><button class="btn ghost sm" type="button" id="addItem">' + icon("plus") + esc(a("o_add_item")) + "</button></div>" +
      '<datalist id="productNames">' + products.map(function (p) { return '<option value="' + esc(p.n) + '">'; }).join("") + "</datalist></div>" +
      '<div class="fs"><p class="legend">' + esc(a("sec_money")) + '</p><div class="grid2">' + f("o_discount", a("o_discount"), x.discount ? Number(x.discount).toLocaleString("en-US") : "") + f("o_fee", a("o_fee"), x.fee ? Number(x.fee).toLocaleString("en-US") : "") + "</div></div>" +
      '<div class="field"><label for="o_note">' + esc(a("o_note")) + '</label><textarea id="o_note" rows="3">' + esc(x.note) + "</textarea></div></div>" +
      '<div class="dlg-foot"><span></span><div class="grp"><button class="btn ghost" type="button" data-closedlg>' + esc(a("e_cancel")) + '</button><button class="btn" type="submit">' + esc(a("o_save")) + "</button></div></div></form>";
    dlg.showModal();
  }
  function readOrderEditor() {
    var x = editingOrder.o, form = document.getElementById("oform");
    var g = function (id) { return document.getElementById(id).value.trim(); };
    x.id = g("o_id") || x.id; x.date = g("o_date") || todayISO(); x.method = g("o_method"); x.pay = g("o_pay");
    var newStage = g("o_stage");
    x.name = g("o_name"); x.phone = g("o_phone"); x.delivery = g("o_delivery"); x.address = g("o_address"); x.tracking = g("o_tracking");
    x.due = g("o_due"); x.note = g("o_note"); x.discount = num(g("o_discount")); x.fee = num(g("o_fee"));
    x.items = Array.prototype.map.call(form.querySelectorAll("#itemRows .itemrow"), function (row) {
      return { name: row.querySelector(".i-name").value.trim(), qty: num(row.querySelector(".i-qty").value) || 1, details: row.querySelector(".i-det").value.trim(), price: num(row.querySelector(".i-price").value) };
    }).filter(function (it) { return it.name; });
    if (newStage !== x.stage) setStage(x, newStage);
    return !!(x.name && x.items.length);
  }
  function closeDialog() { var d = document.getElementById("dlg"); if (d.open) d.close(); editing = null; editingOrder = null; }

  /* paste a WhatsApp order written by the shop checkout */
  function parseOrderMessage(text) {
    var L = function (k) { return T[k] ? [T[k][0], T[k][1]] : []; };
    var starts = function (line, keys) {
      for (var i = 0; i < keys.length; i++) {
        var labels = L(keys[i]);
        for (var j = 0; j < labels.length; j++) if (labels[j] && line.indexOf(labels[j]) === 0) return line.slice(labels[j].length).replace(/^\s*[:：]?\s*/, "");
      }
      return null;
    };
    var o = blankOrder(); o.items = [];
    var idm = text.match(/MA-\d{6}-[A-Z0-9]{4}/); if (idm) o.id = idm[0];
    text.split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim(); if (!line) return;
      var m = line.match(/^\d+\.\s+(.+)$/);
      if (m) {
        var rest = m[1], cut = rest.lastIndexOf(" — "), priceStr = "";
        if (cut > -1) { priceStr = rest.slice(cut + 3); rest = rest.slice(0, cut); }
        var mm = rest.match(/^(.*?) × (\d+)(?: \((.*)\))?$/);
        var digits = priceStr.replace(/[^\d]/g, "");
        o.items.push({ name: mm ? mm[1] : rest, qty: mm ? +mm[2] : 1, details: mm && mm[3] ? mm[3] : "", price: digits ? +digits : 0 });
        return;
      }
      var v;
      if ((v = starts(line, ["name"])) !== null) o.name = v;
      else if ((v = starts(line, ["phone"])) !== null) o.phone = v;
      else if ((v = starts(line, ["delivery"])) !== null) { var parts = v.split(" — "); o.delivery = parts[0]; if (parts[1]) o.address = parts.slice(1).join(" — "); }
      else if ((v = starts(line, ["co_note"])) !== null) o.note = v;
    });
    return o.items.length ? o : null;
  }
  function exportCsv() {
    var q = function (v) { v = String(v == null ? "" : v); return '"' + v.replace(/"/g, '""') + '"'; };
    var rows = [["Order", "Date", "Name", "Phone", "Delivery", "Address", "Channel", "Items", "Subtotal", "Discount", "Delivery fee", "Total (kip)", "Payment", "Status", "Due", "Tracking", "Notes"]];
    orders.forEach(function (o) {
      rows.push([o.id, o.date, o.name, o.phone, o.delivery, o.address, a("m_" + o.method), o.items.map(function (it) { return it.name + " x" + it.qty + (it.details ? " (" + it.details + ")" : ""); }).join("; "), orderSub(o), o.discount, o.fee, orderTotal(o), a("pay_" + o.pay), a("st_" + o.stage), o.due, o.tracking, o.note]);
    });
    download("minise-orders-" + todayISO() + ".csv", "﻿" + rows.map(function (r) { return r.map(q).join(","); }).join("\r\n"), "text/csv;charset=utf-8");
  }

  /* invoice and packing slip */
  function printOrder(o, kind) {
    var slip = kind === "slip";
    var addr = settings.addr[lang === "lo" ? 1 : 0] || settings.addr[0] || "";
    var shop = "<b>Minise Arte</b><br>" + esc(addr) + "<br>WhatsApp " + esc(settings.wa.mainShow) + (settings.wa.altShow ? " · " + esc(settings.wa.altShow) : "") + "<br>@minise.arte";
    var rows = o.items.map(function (it) {
      return "<tr>" + (slip ? '<td><span class="tick"></span></td>' : "") + "<td><b>" + esc(it.name) + "</b>" + (it.details ? "<br><small>" + esc(it.details) + "</small>" : "") + '</td><td class="r">' + (it.qty || 1) + "</td>" + (slip ? "" : '<td class="r">' + (it.price ? esc(money(it.price)) : "—") + "</td>") + "</tr>";
    }).join("");
    var html = '<div class="doc"><div class="doc-head"><div><img src="images/logo.png" alt="Minise Arte"><h1>' + esc(slip ? a("slip_title") : a("inv_title")) + '</h1></div><div class="shop">' + shop + "</div></div>" +
      '<div class="meta"><div><h4>' + esc(a("inv_order")) + "</h4><b>" + esc(o.id) + "</b><br>" + esc(a("inv_date")) + ": " + esc(fmtDate(o.date)) + (o.tracking ? "<br>" + esc(a("f_tracking")) + ": " + esc(o.tracking) : "") + "</div>" +
      "<div><h4>" + esc(a("inv_bill_to")) + "</h4><b>" + esc(o.name) + "</b><br>" + esc(o.phone) + "<br>" + esc(o.delivery) + (o.address ? "<br>" + esc(o.address) : "") + "</div></div>" +
      "<table><thead><tr>" + (slip ? '<th style="width:60px">' + esc(a("slip_packed")) + "</th>" : "") + "<th>" + esc(a("inv_item")) + '</th><th class="r">' + esc(a("inv_qty")) + "</th>" + (slip ? "" : '<th class="r">' + esc(a("inv_amount")) + "</th>") + "</tr></thead><tbody>" + rows + "</tbody></table>" +
      (slip ? "" : '<div class="totals"><div><span>' + esc(a("subtotal")) + "</span><span>" + esc(money(orderSub(o))) + "</span></div>" + (o.discount ? "<div><span>" + esc(a("discount")) + "</span><span>− " + esc(money(o.discount)) + "</span></div>" : "") + (o.fee ? "<div><span>" + esc(a("fee")) + "</span><span>" + esc(money(o.fee)) + "</span></div>" : "") + '<div class="grand"><span>' + esc(a("total")) + "</span><span>" + esc(money(orderTotal(o))) + "</span></div></div>" +
        (isPaid(o) ? '<p class="pay"><b>' + esc(a("inv_paid")) + "</b></p>" : '<div class="pay"><img src="' + esc(settings.qr) + '" alt="LAO QR"><div><b>' + esc(a("inv_pay")) + "</b><br>" + esc(settings.account) + "<br>" + esc(a("total")) + ": <b>" + esc(money(orderTotal(o))) + "</b></div></div>")) +
      (o.note ? '<div class="noteline"><b>' + esc(a("sec_note")) + ":</b> " + esc(o.note) + "</div>" : "") +
      '<p class="foot">' + esc(a("inv_thanks")) + "</p></div>";
    var area = document.getElementById("printArea");
    area.innerHTML = html;
    var imgs = area.querySelectorAll("img"), left = imgs.length;
    var fire = function () { setTimeout(function () { window.print(); }, 50); };
    if (!left) return fire();
    Array.prototype.forEach.call(imgs, function (im) { if (im.complete) { if (--left === 0) fire(); } else { im.onload = im.onerror = function () { if (--left === 0) fire(); }; } });
  }

  /* ---------- customers ---------- */
  function customerList() {
    var map = {};
    orders.forEach(function (o) {
      var k = customerKey(o);
      if (!map[k]) map[k] = { key: k, name: o.name, phone: o.phone, count: 0, spent: 0, last: "" };
      var c = map[k];
      c.count++;
      if (isPaid(o)) c.spent += orderTotal(o);
      if (o.date >= c.last) { c.last = o.date; if (o.name) c.name = o.name; if (o.phone) c.phone = o.phone; }
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }
  function customersPage() {
    var list = customerList();
    var repeat = list.filter(function (c) { return c.count > 1; }).length;
    var avg = list.length ? Math.round(list.reduce(function (s, c) { return s + c.spent; }, 0) / list.length) : 0;
    return '<div class="tiles"><div class="tile"><span>' + esc(a("cu_total")) + "</span><b>" + list.length + '</b></div><div class="tile"><span>' + esc(a("cu_repeat")) + "</span><b>" + repeat + '</b></div><div class="tile"><span>' + esc(a("cu_avg")) + "</span><b>" + esc(money(avg)) + "</b></div></div>" +
      '<div class="toolbar"><input type="search" id="cq" placeholder="' + esc(a("cu_search")) + '" value="' + esc(CF.q) + '" aria-label="' + esc(a("cu_search")) + '"></div>' +
      '<div class="table-wrap" id="ctable"></div>';
  }
  function renderCustomerTable() {
    var q = CF.q.trim().toLowerCase();
    var list = customerList().filter(function (c) { return !q || (c.name + " " + c.phone).toLowerCase().indexOf(q) > -1; })
      .sort(function (x, y) { return (y.spent - x.spent) || y.last.localeCompare(x.last); });
    var box = document.getElementById("ctable");
    if (!list.length) { box.innerHTML = '<div class="empty-state">' + icon("customers") + "<p>" + esc(a("cu_none")) + "</p></div>"; return; }
    box.innerHTML = '<table class="tbl"><thead><tr><th>' + esc(a("col_customer")) + "</th><th>" + esc(a("col_phone")) + '</th><th class="num">' + esc(a("col_orders")) + '</th><th class="num">' + esc(a("col_spent")) + "</th><th>" + esc(a("col_last")) + "</th><th></th></tr></thead><tbody>" +
      list.map(function (c) {
        var wa = intlPhone(c.phone);
        return "<tr><td><b>" + esc(c.name || "—") + "</b>" + (c.count > 1 ? ' <span class="pill st-ready">' + esc(a("cu_repeat_badge")) + "</span>" : "") + '</td><td class="num">' + esc(c.phone) + '</td><td class="num">' + c.count + '</td><td class="num"><b>' + esc(money(c.spent)) + "</b></td><td>" + esc(fmtDate(c.last)) + '</td><td class="actions">' +
          (wa ? '<a class="btn ghost sm" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + icon("chat") + "WhatsApp</a>" : "") +
          '<button class="btn ghost sm" type="button" data-cust="' + esc(c.phone || c.name) + '">' + esc(a("cu_view")) + "</button></td></tr>";
      }).join("") + "</tbody></table>";
  }

  /* ---------- products ---------- */
  function pFiltered() {
    var q = PF.q.trim().toLowerCase();
    var list = products.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) {
      var p = x.p;
      if (PF.type !== "all" && p.t.indexOf(PF.type) < 0) return false;
      if (PF.status === "visible" && p.hid) return false;
      if (PF.status === "hidden" && !p.hid) return false;
      if (PF.status === "so" && !p.so) return false;
      if (PF.status === "noprice" && p.o.length) return false;
      if (PF.status === "pinned" && !p.feat) return false;
      if (PF.status === "old" && p.cur) return false;
      if (q && (p.n + " " + p.s).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var minP = function (p) { return p.o.length ? Math.min.apply(null, p.o.map(function (o) { return o.price; })) : Infinity; };
    var sorts = {
      name: function (x, y) { return x.p.n.localeCompare(y.p.n); },
      "new": function (x, y) { return (y.p.fp || "").localeCompare(x.p.fp || ""); },
      likes: function (x, y) { return y.p.lk - x.p.lk; },
      price: function (x, y) { return minP(x.p) - minP(y.p); }
    };
    return list.sort(sorts[PF.sort]);
  }
  function productsPage() {
    var n = function (f) { return products.filter(f).length; };
    var tiles = [
      ["all", a("p_total"), products.length], ["visible", a("p_visible"), n(function (p) { return !p.hid; })],
      ["hidden", a("p_hidden"), n(function (p) { return p.hid; })], ["so", a("p_soldout"), n(function (p) { return p.so; })],
      ["noprice", a("p_noprice"), n(function (p) { return !p.o.length && !p.hid; })], ["pinned", a("p_pinned"), n(function (p) { return p.feat; })]
    ];
    return '<div class="tiles">' + tiles.map(function (tl) { return '<button class="tile' + (PF.status === tl[0] ? " on" : "") + '" type="button" data-pstatus="' + tl[0] + '"><span>' + esc(tl[1]) + "</span><b>" + tl[2] + "</b></button>"; }).join("") + "</div>" +
      '<div class="toolbar"><input type="search" id="pq" placeholder="' + esc(a("search_products")) + '" value="' + esc(PF.q) + '" aria-label="' + esc(a("search_products")) + '">' +
      '<select id="ptype" aria-label="' + esc(a("e_types")) + '"><option value="all">' + esc(a("all_types")) + "</option>" + TYPES.map(function (ty) { return '<option value="' + ty + '"' + (PF.type === ty ? " selected" : "") + ">" + esc(typeName(ty)) + "</option>"; }).join("") + "</select>" +
      '<select id="pstatus" aria-label="' + esc(a("col_status")) + '">' + ["all", "visible", "hidden", "so", "noprice", "pinned", "old"].map(function (s) { return '<option value="' + s + '"' + (PF.status === s ? " selected" : "") + ">" + esc(a("st_" + s)) + "</option>"; }).join("") + "</select>" +
      '<select id="psort" aria-label="Sort">' + ["name", "new", "likes", "price"].map(function (s) { return '<option value="' + s + '"' + (PF.sort === s ? " selected" : "") + ">" + esc(a("sort_" + s)) + "</option>"; }).join("") + "</select>" +
      '<button class="btn" type="button" id="addProduct">' + icon("plus") + esc(a("add_product")) + "</button></div>" +
      '<p class="count" id="pcount"></p><div class="table-wrap" id="ptable"></div>';
  }
  function renderProductTable() {
    var list = pFiltered();
    document.getElementById("pcount").textContent = a("shown", { n: list.length });
    var box = document.getElementById("ptable");
    if (!list.length) { box.innerHTML = '<div class="empty-state">' + icon("products") + "<p>" + esc(a("none_match")) + "</p></div>"; return; }
    box.innerHTML = '<table class="tbl"><thead><tr><th>' + esc(a("col_product")) + "</th><th>" + esc(a("col_price")) + "</th><th>" + esc(a("col_status")) + '</th><th class="num">' + esc(a("col_ig")) + "</th><th></th></tr></thead><tbody>" +
      list.map(function (x) {
        var p = x.p, chips = [];
        if (p.hid) chips.push('<span class="pill muted">' + esc(a("c_hidden")) + "</span>");
        if (p.so) chips.push('<span class="pill due-over">' + esc(a("c_so")) + "</span>");
        if (p.feat) chips.push('<span class="pill st-making">' + esc(a("c_pin", { n: p.feat })) + "</span>");
        if (p.rts) chips.push('<span class="pill st-ready">' + esc(a("c_rts")) + "</span>");
        if (!p.cur) chips.push('<span class="pill muted">' + esc(a("c_old")) + "</span>");
        if (!chips.length) chips.push('<span class="pill st-new">' + esc(a("p_visible")) + "</span>");
        return '<tr class="click" data-edit="' + x.i + '"><td><div class="prod"><img class="thumb" src="' + esc(p.img[0] || "") + '" alt="" loading="lazy"><div><b>' + esc(p.n) + "</b><small>" + esc(p.t.map(typeName).join(", ")) + "</small></div></div></td>" +
          "<td>" + priceLabel(p) + '</td><td><div class="chiprow">' + chips.join("") + "</div></td>" +
          '<td class="num"><small>' + esc((p.ig && p.ig.length) ? a("posts_likes", { p: p.pc || 0, l: p.lk || 0 }) : a("c_new")) + "</small></td>" +
          '<td class="actions"><button class="btn ghost sm" type="button" data-so="' + x.i + '">' + esc(p.so ? a("mark_back") : a("mark_so")) + '</button><button class="btn ghost sm" type="button" data-hid="' + x.i + '">' + esc(p.hid ? a("show") : a("hide")) + "</button></td></tr>";
      }).join("") + "</tbody></table>";
  }
  function blankProduct() {
    return { s: "", n: "", t: ["bracelet"], g: [], o: [], from: false, add: null, last: 0, lastYear: "", other: "", en: "", lo: "", li: null,
      c: ["silver", "gold"], rts: 0, day: 0, ph: 0, stainless: 1, waterproof: 1, polaroid: 0, s925: 0, cur: 1, img: [], ig: [], pc: 0, lk: 0, fp: todayISO(), lp: todayISO() };
  }
  function optRow(o) {
    return '<div class="optrow"><input type="text" class="o-en" placeholder="' + esc(a("e_label_en")) + '" value="' + esc(o.en) + '" aria-label="' + esc(a("e_label_en")) + '">' +
      '<input type="text" class="o-lo" placeholder="' + esc(a("e_label_lo")) + '" value="' + esc(o.lo) + '" aria-label="' + esc(a("e_label_lo")) + '">' +
      '<input type="text" class="o-price" inputmode="numeric" placeholder="' + esc(a("e_kip")) + '" value="' + (o.price ? Number(o.price).toLocaleString("en-US") : "") + '" aria-label="' + esc(a("e_kip")) + '">' +
      '<button class="icon-btn" type="button" data-delrow aria-label="' + esc(a("e_remove")) + '">' + icon("x") + "</button></div>";
  }
  function photoGrid() {
    return editing.img.map(function (src, i) {
      return '<div class="ph' + (i === 0 ? " cover" : "") + '"><img src="' + esc(src) + '" alt=""><div class="tools">' +
        '<button type="button" data-phmove="' + i + '" data-d="-1" aria-label="Move left"' + (i === 0 ? " disabled" : "") + ">◀</button>" +
        '<button type="button" data-phdel="' + i + '" aria-label="' + esc(a("e_remove")) + '">✕</button>' +
        '<button type="button" data-phmove="' + i + '" data-d="1" aria-label="Move right"' + (i === editing.img.length - 1 ? " disabled" : "") + ">▶</button></div></div>";
    }).join("");
  }
  function chk(name, value, on, label) { return '<label><input type="checkbox" name="' + name + '" value="' + value + '"' + (on ? " checked" : "") + "> " + esc(label) + "</label>"; }
  function openEditor(i, preset) {
    editingIndex = i;
    editing = preset || (i >= 0 ? clone(products[i]) : blankProduct());
    var p = editing;
    var sec = function (title, body) { return '<div class="fs"><p class="legend">' + esc(title) + "</p>" + body + "</div>"; };
    var dlg = document.getElementById("dlg");
    dlg.innerHTML = '<form id="pform" novalidate><div class="dlg-head"><h2>' + esc(i >= 0 ? p.n : a("e_new")) + '</h2><button class="icon-btn" type="button" data-closedlg aria-label="' + esc(a("close")) + '">' + icon("x") + "</button></div>" +
      '<div class="dlg-body"><p class="alert warn" id="perr" hidden></p>' +
      sec(a("e_basics"), '<div class="field"><label for="e_n">' + esc(a("e_name")) + '</label><input type="text" id="e_n" value="' + esc(p.n) + '" required></div>' +
        '<div class="field"><span class="lbl">' + esc(a("e_types")) + '</span><div class="checks">' + TYPES.map(function (ty) { return chk("ty", ty, p.t.indexOf(ty) > -1, typeName(ty)); }).join("") + "</div></div>" +
        '<div class="field"><span class="lbl">' + esc(a("e_tags")) + '</span><div class="checks">' + TAGS.map(function (g) { return chk("tg", g, p.g.indexOf(g) > -1, a("tag_" + g)); }).join("") + "</div></div>") +
      sec(a("e_status"), '<div class="checks">' + chk("st", "hid", p.hid, a("f_hid")) + chk("st", "so", p.so, a("f_so")) + chk("st", "cur", p.cur, a("f_cur")) + "</div>" +
        '<div class="field"><label for="e_feat">' + esc(a("f_feat")) + '</label><input type="text" id="e_feat" inputmode="numeric" value="' + (p.feat || "") + '" style="max-width:120px"><span class="hint">' + esc(a("f_feat_hint")) + "</span></div>") +
      sec(a("e_price"), '<p class="hint">' + esc(a("e_price_hint")) + '</p><div id="optRows" class="fs">' + p.o.map(optRow).join("") + "</div>" +
        '<div><button class="btn ghost sm" type="button" id="addOpt">' + icon("plus") + esc(a("e_add_price")) + '</button></div><div class="checks">' + chk("from", "1", p.from, a("e_from")) + "</div>" +
        (p.last || p.other ? '<p class="hint">' + esc(a("ask")) + ": " + esc(p.last ? money(p.last) + " (" + p.lastYear + ")" : p.other) + "</p>" : "") +
        '<div class="field"><span class="lbl">' + esc(a("e_addon")) + '</span><span class="hint">' + esc(a("e_addon_hint")) + '</span><div class="optrow"><input type="text" id="e_add_en" placeholder="' + esc(a("e_label_en")) + '" value="' + esc(p.add ? p.add.en : "") + '" aria-label="' + esc(a("e_label_en")) + '"><input type="text" id="e_add_lo" placeholder="' + esc(a("e_label_lo")) + '" value="' + esc(p.add ? p.add.lo : "") + '" aria-label="' + esc(a("e_label_lo")) + '"><input type="text" id="e_add_price" inputmode="numeric" placeholder="' + esc(a("e_kip")) + '" value="' + (p.add ? Number(p.add.price).toLocaleString("en-US") : "") + '" aria-label="' + esc(a("e_kip")) + '"><span></span></div></div>') +
      sec(a("e_custom"), '<div class="grid3"><div class="field"><label for="e_li_min">' + esc(a("e_li_min")) + '</label><input type="text" id="e_li_min" inputmode="numeric" value="' + (p.li ? p.li[0] : "") + '"></div>' +
        '<div class="field"><label for="e_li_max">' + esc(a("e_li_max")) + '</label><input type="text" id="e_li_max" inputmode="numeric" value="' + (p.li ? p.li[1] : "") + '"></div></div><p class="hint">' + esc(a("e_li_hint")) + "</p>" +
        '<div class="field"><span class="lbl">' + esc(a("e_colours")) + '</span><div class="checks">' + chk("col", "silver", p.c.indexOf("silver") > -1, a("silver")) + chk("col", "gold", p.c.indexOf("gold") > -1, a("gold")) + "</div></div>" +
        '<div class="field"><span class="lbl">' + esc(a("e_features")) + '</span><div class="checks">' + chk("fl", "rts", p.rts, a("f_rts")) + chk("fl", "day", p.day, a("f_day")) + chk("fl", "ph", p.ph, a("f_ph")) + chk("fl", "polaroid", p.polaroid, a("f_polaroid")) + chk("fl", "stainless", p.stainless, a("f_stainless")) + chk("fl", "waterproof", p.waterproof, a("f_water")) + chk("fl", "s925", p.s925, a("f_s925")) + "</div></div>") +
      sec(a("e_photos"), '<p class="hint">' + esc(a("e_photos_hint")) + '</p><div class="photos" id="photoGrid">' + photoGrid() + "</div>" +
        '<div><label class="btn ghost sm" for="e_photos" style="cursor:pointer">' + icon("upload") + esc(a("e_add_photos")) + '</label><input type="file" id="e_photos" accept="image/*" multiple class="sr"></div>') +
      sec(a("e_desc"), '<div class="field"><label for="e_en">' + esc(a("e_desc_en")) + '</label><textarea id="e_en" rows="5">' + esc(p.en) + "</textarea></div>" +
        '<div class="field"><label for="e_lo">' + esc(a("e_desc_lo")) + '</label><textarea id="e_lo" rows="5">' + esc(p.lo) + "</textarea></div>") +
      (p.ig && p.ig.length ? sec(a("e_ig"), '<div class="links">' + p.ig.map(function (id) { return '<a class="link" href="https://www.instagram.com/p/' + id + '/" target="_blank" rel="noopener">' + id + "</a>"; }).join("") + "</div>") : "") +
      '</div><div class="dlg-foot"><div class="grp">' + (i >= 0 ? '<button class="btn danger" type="button" id="delProduct">' + icon("trash") + esc(a("e_delete")) + '</button><button class="btn ghost" type="button" id="dupProduct">' + icon("copy") + esc(a("e_duplicate")) + "</button>" : "") + "</div>" +
      '<div class="grp"><button class="btn ghost" type="button" data-closedlg>' + esc(a("e_cancel")) + '</button><button class="btn" type="submit">' + esc(a("e_save")) + "</button></div></div></form>";
    dlg.showModal();
    document.getElementById("e_n").focus();
  }
  function readEditor() {
    var p = editing, f = document.getElementById("pform"), errs = [];
    var vals = function (name) { return Array.prototype.map.call(f.querySelectorAll('input[name="' + name + '"]:checked'), function (x) { return x.value; }); };
    p.n = document.getElementById("e_n").value.trim();
    p.t = vals("ty"); p.g = vals("tg");
    var st = vals("st");
    if (st.indexOf("hid") > -1) p.hid = 1; else delete p.hid;
    if (st.indexOf("so") > -1) p.so = 1; else delete p.so;
    p.cur = st.indexOf("cur") > -1 ? 1 : 0;
    var feat = num(document.getElementById("e_feat").value);
    if (feat) p.feat = feat; else delete p.feat;
    var badPrice = false;
    p.o = Array.prototype.map.call(f.querySelectorAll("#optRows .optrow"), function (row) {
      var price = num(row.querySelector(".o-price").value);
      if (!price) badPrice = true;
      return { en: row.querySelector(".o-en").value.trim(), lo: row.querySelector(".o-lo").value.trim(), price: price };
    });
    p.from = !!f.querySelector('input[name="from"]:checked');
    var addP = num(document.getElementById("e_add_price").value);
    p.add = addP ? { en: document.getElementById("e_add_en").value.trim() || "Extra charm", lo: document.getElementById("e_add_lo").value.trim() || "Charm ເພີ່ມ", price: addP } : null;
    var lmin = num(document.getElementById("e_li_min").value), lmax = num(document.getElementById("e_li_max").value);
    p.li = lmin || lmax ? [lmin || lmax, Math.max(lmin, lmax)] : null;
    p.c = vals("col");
    var fl = vals("fl");
    ["rts", "day", "ph", "polaroid", "stainless", "waterproof", "s925"].forEach(function (k) { p[k] = fl.indexOf(k) > -1 ? 1 : 0; });
    p.en = document.getElementById("e_en").value.trim();
    p.lo = document.getElementById("e_lo").value.trim();
    if (!p.n) errs.push(a("e_need_name"));
    if (!p.t.length) errs.push(a("e_need_type"));
    if (!p.img.length) errs.push(a("e_need_photo"));
    if (badPrice) errs.push(a("e_bad_price"));
    return errs;
  }

  /* ---------- stock ---------- */
  function stockPage() {
    var n = function (f) { return products.filter(f).length; };
    var seg = '<div class="seg">' + [["all", a("f_all"), products.length], ["so", a("p_soldout"), n(function (p) { return p.so; })], ["hid", a("p_hidden"), n(function (p) { return p.hid; })]].map(function (s) {
      return '<button type="button" data-sf="' + s[0] + '" class="' + (SQ.f === s[0] ? "on" : "") + '">' + esc(s[1]) + '<span class="n">' + s[2] + "</span></button>";
    }).join("") + "</div>";
    return '<div class="toolbar"><input type="search" id="sq" placeholder="' + esc(a("search_products")) + '" value="' + esc(SQ.q) + '" aria-label="' + esc(a("search_products")) + '">' + seg + "</div>" +
      '<div class="table-wrap" id="stable"></div>';
  }
  function renderStockTable() {
    var q = SQ.q.trim().toLowerCase();
    var list = products.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) {
      if (SQ.f === "so" && !x.p.so) return false;
      if (SQ.f === "hid" && !x.p.hid) return false;
      return !q || x.p.n.toLowerCase().indexOf(q) > -1;
    }).sort(function (x, y) { return x.p.n.localeCompare(y.p.n); });
    var box = document.getElementById("stable");
    if (!list.length) { box.innerHTML = '<div class="empty-state">' + icon("stock") + "<p>" + esc(a("none_match")) + "</p></div>"; return; }
    box.innerHTML = '<table class="tbl"><thead><tr><th>' + esc(a("col_product")) + "</th><th>" + esc(a("col_price")) + "</th><th>" + esc(a("in_stock")) + "</th><th>" + esc(a("in_shop")) + "</th></tr></thead><tbody>" +
      list.map(function (x) {
        var p = x.p;
        return '<tr><td><div class="prod"><img class="thumb" src="' + esc(p.img[0] || "") + '" alt="" loading="lazy"><div><b>' + esc(p.n) + "</b><small>" + esc(typeName(p.t[0])) + "</small></div></div></td><td>" + priceLabel(p) + "</td>" +
          '<td><label class="sw"><input type="checkbox" data-sw="so" data-i="' + x.i + '"' + (p.so ? "" : " checked") + ' aria-label="' + esc(a("in_stock") + ": " + p.n) + '"><span></span></label></td>' +
          '<td><label class="sw"><input type="checkbox" data-sw="hid" data-i="' + x.i + '"' + (p.hid ? "" : " checked") + ' aria-label="' + esc(a("in_shop") + ": " + p.n) + '"><span></span></label></td></tr>';
      }).join("") + "</tbody></table>";
  }

  /* ---------- settings pages ---------- */
  function pairFields(id, val, label) {
    return '<div class="grid2"><div class="field"><label for="' + id + '_en">' + esc(label) + " · " + esc(a("en")) + '</label><input type="text" id="' + id + '_en" data-set="' + id + '" data-l="0" value="' + esc(val[0]) + '"></div>' +
      '<div class="field"><label for="' + id + '_lo">' + esc(label) + " · " + esc(a("lo")) + '</label><input type="text" id="' + id + '_lo" data-set="' + id + '" data-l="1" value="' + esc(val[1]) + '"></div></div>';
  }
  function shopPage() {
    return '<form id="sform" class="set-grid" novalidate>' +
      '<section class="card"><div class="card-head"><h2>' + esc(a("s_ann")) + '</h2></div><p class="hint">' + esc(a("s_ann_hint")) + "</p>" +
      settings.ann.slice(0, 3).map(function (v, i) { return pairFields("ann" + i, v, a("s_msg", { n: i + 1 })); }).join("") + "</section>" +
      '<section class="card"><div class="card-head"><h2>' + esc(a("s_contact")) + '</h2></div><div class="grid2"><div class="field"><label for="s_wa_main">' + esc(a("s_wa_main")) + '</label><input type="tel" id="s_wa_main" value="' + esc(settings.wa.mainShow) + '"></div>' +
      '<div class="field"><label for="s_wa_alt">' + esc(a("s_wa_alt")) + '</label><input type="tel" id="s_wa_alt" value="' + esc(settings.wa.altShow) + '"></div></div>' +
      pairFields("hours", settings.hours, a("s_hours")) + pairFields("addr", settings.addr, a("s_addr")) + "</section>" +
      '<section class="card"><div class="card-head"><h2>' + esc(a("s_pay")) + '</h2></div><div class="field"><label for="s_account">' + esc(a("s_account")) + '</label><input type="text" id="s_account" value="' + esc(settings.account) + '"></div>' +
      '<div class="field"><span class="lbl">' + esc(a("s_qr")) + '</span><img class="qr-prev" id="qrPrev" src="' + esc(settings.qr) + '" alt="LAO QR">' +
      '<div><label class="btn ghost sm" for="s_qr" style="cursor:pointer">' + icon("upload") + esc(a("s_qr_btn")) + '</label><input type="file" id="s_qr" accept="image/*" class="sr"></div></div></section>' +
      '<p class="hint">' + esc(a("s_note")) + "</p></form>";
  }
  function messagesPage() {
    var ph = ["{name}", "{id}", "{total}", "{delivery}", "{tracking}", "{account}"];
    return '<div class="set-grid"><section class="card"><p class="page-intro">' + esc(a("tpl_intro")) + '</p><div class="chiprow"><span class="hint">' + esc(a("tpl_placeholders")) + ":</span>" + ph.map(function (x) { return '<span class="code">' + x + "</span>"; }).join("") + "</div></section>" +
      '<section class="card">' + TPL_KEYS.map(function (k, i) {
        var cur = settings.templates[k] || [AT["msg_" + k][0], AT["msg_" + k][1]];
        return '<div class="tpl' + (i === 0 ? " first" : "") + '"><div class="tpl-head"><b>' + esc(a("tpl_" + k)) + '</b><button class="link" type="button" data-tplreset="' + k + '">' + esc(a("tpl_reset")) + '</button></div><div class="grid2">' +
          '<div class="field"><label for="tpl_' + k + '_en">' + esc(a("en")) + '</label><textarea id="tpl_' + k + '_en" data-tpl="' + k + '" data-l="0" rows="3">' + esc(cur[0]) + "</textarea></div>" +
          '<div class="field"><label for="tpl_' + k + '_lo">' + esc(a("lo")) + '</label><textarea id="tpl_' + k + '_lo" data-tpl="' + k + '" data-l="1" rows="3">' + esc(cur[1]) + "</textarea></div></div></div>";
      }).join("") + "</section></div>";
  }
  function backupPage() {
    var last = load("minise_last_backup");
    return '<div class="set-grid">' +
      '<section class="card"><div class="card-head"><h2>' + esc(a("bk_title")) + '</h2></div><p class="page-intro">' + esc(a("bk_text")) + '</p><p class="hint">' + esc(a("bk_stats", { p: products.length, o: orders.length, c: customerList().length })) + " · " + esc(last ? a("bk_last", { d: fmtWhen(last) }) : a("bk_never")) + '</p><div><button class="btn" type="button" id="bkDownload">' + icon("download") + esc(a("bk_btn")) + "</button></div></section>" +
      '<section class="card"><div class="card-head"><h2>' + esc(a("rs_title")) + '</h2></div><p class="page-intro">' + esc(a("rs_text")) + '</p><div><label class="btn ghost" for="rsFile" style="cursor:pointer">' + icon("upload") + esc(a("rs_btn")) + '</label><input type="file" id="rsFile" accept="application/json,.json" class="sr"></div></section>' +
      '<section class="card"><div class="card-head"><h2>' + esc(a("bk_files_title")) + '</h2></div><p class="page-intro">' + esc(a("bk_files_text")) + '</p><div><button class="btn ghost" type="button" id="bkFiles">' + icon("download") + esc(a("bk_files_btn")) + "</button></div></section>" +
      '<section class="card"><div class="card-head"><h2>' + esc(a("dz_title")) + '</h2></div><p class="page-intro">' + esc(a(ONLINE ? "dz_text_online" : "dz_text")) + '</p><div><button class="btn danger" type="button" id="dzClear"' + (orders.length ? "" : " disabled") + ">" + icon("trash") + esc(a("dz_btn")) + "</button></div></section></div>";
  }
  function onlinePage() {
    if (!ONLINE) {
      return '<div class="set-grid"><section class="card"><div class="card-head"><h2>' + esc(a("on_h_setup")) + '</h2></div><p class="page-intro">' + esc(a("on_setup_p")) + "</p>" +
        '<ol class="steps-list">' + [1, 2, 3, 4, 5].map(function (i) { return "<li>" + esc(a("on_s" + i)) + "</li>"; }).join("") + "</ol>" +
        '<form id="onForm" class="on-form" novalidate><label for="onUrl"><b>' + esc(a("on_url")) + '</b></label><div class="row"><input type="text" id="onUrl" inputmode="url" autocomplete="off" spellcheck="false" placeholder="' + esc(a("on_url_ph")) + '">' +
        '<button class="btn" type="submit">' + icon("cloud") + esc(a("on_connect")) + '</button></div><p class="alert warn" id="onMsg" role="status" hidden></p></form></section></div>';
    }
    var fileApi = String((window.MINISE_SETTINGS || {}).api || "").trim();
    var pill = SYNC.state === "ok" ? '<span class="pill st-ready">' + esc(a("on_status_ok", { t: fmtTime(SYNC.at) })) + "</span>" :
      SYNC.state === "err" ? '<span class="pill due-over">' + esc(a("on_status_err")) + "</span>" : '<span class="pill muted">' + esc(a("on_status_wait")) + "</span>";
    return '<div class="set-grid">' +
      '<section class="card"><div class="card-head"><h2>' + esc(a("on_h_connected")) + "</h2>" + pill + '</div><p class="page-intro">' + esc(a("on_connected_p")) + "</p>" +
      '<dl class="kv"><dt>' + esc(a("on_url")) + '</dt><dd><code class="code url">' + esc(API) + "</code></dd><dt>" + esc(a("on_last")) + "</dt><dd>" + esc(SYNC.at ? fmtWhen(new Date(SYNC.at).toISOString()) : a("on_never")) + "</dd><dt>" + esc(a("k_orders")) + "</dt><dd>" + orders.length + "</dd></dl>" +
      '<div class="chiprow">' + (SYNC.sheet ? '<a class="btn ghost" href="' + esc(SYNC.sheet) + '" target="_blank" rel="noopener">' + icon("external") + esc(a("on_sheet")) + "</a>" : "") +
      '<button class="btn ghost" type="button" id="onSync">' + icon("refresh") + esc(a("on_sync")) + "</button></div></section>" +
      (fileApi === API ? '<section class="card"><p class="alert ok">' + esc(a("on_web_ok")) + "</p></section>" :
        '<section class="card"><div class="card-head"><h2>' + esc(a("on_web_h")) + '</h2></div><p class="page-intro">' + esc(a("on_web_p")) + '</p><div><button class="btn" type="button" id="onWebFile">' + icon("download") + esc(a("on_web_btn")) + "</button></div></section>") +
      '<section class="card"><div class="card-head"><h2>' + esc(a("on_disconnect")) + '</h2></div><p class="page-intro">' + esc(a("on_disc_p")) + "</p>" + (fileApi ? '<p class="hint">' + esc(a("on_disc_file")) + "</p>" : "") +
      '<div><button class="btn ghost" type="button" id="onDisconnect">' + esc(a("on_disconnect")) + "</button></div></section></div>";
  }
  function accountPage() {
    var mins = +(load("minise_admin_autolock") || 30);
    return '<div class="set-grid">' +
      '<form id="pwForm" class="card" novalidate><div class="card-head"><h2>' + esc(a("pw_title")) + "</h2></div>" +
      '<div class="field"><label for="pwCur">' + esc(a("pw_current")) + '</label><input type="password" id="pwCur" autocomplete="current-password"></div>' +
      '<div class="grid2"><div class="field"><label for="pwNew">' + esc(a("lg_new_pass")) + '</label><input type="password" id="pwNew" autocomplete="new-password"></div>' +
      '<div class="field"><label for="pwNew2">' + esc(a("lg_confirm")) + '</label><input type="password" id="pwNew2" autocomplete="new-password"></div></div>' +
      '<p class="alert warn" id="pwMsg" hidden></p><div><button class="btn" type="submit">' + esc(a("pw_change")) + "</button></div></form>" +
      '<section class="card"><div class="card-head"><h2>' + esc(a("al_title")) + '</h2></div><p class="page-intro">' + esc(a("al_text")) + '</p><div class="field" style="max-width:260px"><select id="alSel" aria-label="' + esc(a("al_title")) + '">' +
      [0, 15, 30, 60].map(function (m) { return '<option value="' + m + '"' + (m === mins ? " selected" : "") + ">" + esc(m ? a("al_min", { n: m }) : a("al_off")) + "</option>"; }).join("") + "</select></div></section></div>";
  }
  function downloadBackup() {
    var data = { app: "minise-admin", version: 1, exported: new Date().toISOString(), products: products, settings: settings, orders: orders };
    download("minise-backup-" + todayISO() + ".json", JSON.stringify(data, null, 1), "application/json");
    store("minise_last_backup", new Date().toISOString());
    render();
  }
  function restoreBackup(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(reader.result); } catch (e) { data = null; }
      if (!data || data.app !== "minise-admin" || !Array.isArray(data.products) || !Array.isArray(data.orders)) { toast(a("rs_bad"), 6000); return; }
      if (!confirm(a("rs_confirm", { d: fmtWhen(data.exported), p: data.products.length, o: data.orders.length }))) return;
      products = data.products;
      settings = Object.assign(settings, data.settings || {});
      if (!settings.templates) settings.templates = {};
      orders = data.orders.map(normalizeOrder);
      saveOrders(); markDirty(); render();
      toast(a("rs_done"), 6000);
    };
    reader.readAsText(file);
  }

  /* ---------- global search ---------- */
  var GS = { items: [], sel: -1 };
  function globalSearch(raw) {
    var box = document.getElementById("gres");
    var q = raw.trim().toLowerCase();
    if (!q) { box.hidden = true; GS.items = []; return; }
    var qd = phoneDigits(q);
    var os = orders.filter(function (o) { return (o.id + " " + o.name).toLowerCase().indexOf(q) > -1 || (qd.length >= 4 && phoneDigits(o.phone).indexOf(qd) > -1); }).slice(0, 5);
    var cs = customerList().filter(function (c) { return (c.name + " " + c.phone).toLowerCase().indexOf(q) > -1; }).slice(0, 4);
    var ps = products.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return x.p.n.toLowerCase().indexOf(q) > -1; }).slice(0, 5);
    GS.items = []; GS.sel = -1;
    var html = "";
    if (os.length) html += '<p class="gh">' + esc(a("nav_orders")) + "</p>" + os.map(function (o) { GS.items.push({ k: "o", v: o.id }); return '<button type="button" data-gi="' + (GS.items.length - 1) + '">' + icon("orders") + "<span>" + esc(o.id + " · " + o.name) + "</span><small>" + esc(a("st_" + o.stage)) + "</small></button>"; }).join("");
    if (cs.length) html += '<p class="gh">' + esc(a("nav_customers")) + "</p>" + cs.map(function (c) { GS.items.push({ k: "c", v: c.phone || c.name }); return '<button type="button" data-gi="' + (GS.items.length - 1) + '">' + icon("customers") + "<span>" + esc(c.name || c.phone) + "</span><small>" + esc(a("orders_n", { n: c.count })) + "</small></button>"; }).join("");
    if (ps.length) html += '<p class="gh">' + esc(a("nav_products")) + "</p>" + ps.map(function (x) { GS.items.push({ k: "p", v: x.i }); return '<button type="button" data-gi="' + (GS.items.length - 1) + '"><img src="' + esc(x.p.img[0] || "") + '" alt=""><span>' + esc(x.p.n) + "</span><small>" + esc(typeName(x.p.t[0])) + "</small></button>"; }).join("");
    box.innerHTML = html || '<p class="none">' + esc(a("g_none", { q: raw.trim() })) + "</p>";
    box.hidden = false;
  }
  function openSearchItem(it) {
    if (!it) return;
    document.getElementById("gres").hidden = true;
    document.getElementById("gq").value = "";
    if (it.k === "o") { if (tab !== "orders") go("orders"); openDrawer(it.v); }
    else if (it.k === "c") { OF.q = it.v; OF.stage = "all"; OF.pay = "all"; OF.method = "all"; go("orders"); }
    else if (it.k === "p") { if (tab !== "products") go("products"); openEditor(it.v); }
  }

  /* ---------- sign in ---------- */
  var AUTH_KEY = "minise_admin_auth";
  function sha256Fallback(ascii) {
    var s = unescape(encodeURIComponent(ascii));
    function rr(v, n) { return (v >>> n) | (v << (32 - n)); }
    var maxWord = Math.pow(2, 32), result = "", words = [], bitLen = s.length * 8, hash = [], k = [], primes = 0, composite = {}, i, j;
    for (var c = 2; primes < 64; c++) {
      if (!composite[c]) {
        for (i = 0; i < 313; i += c) composite[i] = c;
        hash[primes] = (Math.pow(c, 0.5) * maxWord) | 0;
        k[primes++] = (Math.pow(c, 1 / 3) * maxWord) | 0;
      }
    }
    s += "\x80";
    while (s.length % 64 - 56) s += "\x00";
    for (i = 0; i < s.length; i++) { j = s.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = (bitLen / maxWord) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a0 = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a0, 2) ^ rr(a0, 13) ^ rr(a0, 22)) + ((a0 & hash[1]) ^ (a0 & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? "0" : "") + b.toString(16); }
    return result;
  }
  function sha256Hex(text) {
    try {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
          return Array.prototype.map.call(new Uint8Array(buf), function (x) { return (x < 16 ? "0" : "") + x.toString(16); }).join("");
        }).catch(function () { return sha256Fallback(text); });
      }
    } catch (e) { /* use the fallback */ }
    return Promise.resolve(sha256Fallback(text));
  }
  function randomSalt() {
    var arr = new Uint8Array(16);
    try { crypto.getRandomValues(arr); } catch (e) { for (var i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256); }
    return Array.prototype.map.call(arr, function (x) { return (x < 16 ? "0" : "") + x.toString(16); }).join("");
  }
  // no built-in password: with the Google Sheet backend (settings.api) the password is checked by Google
  var DEFAULT_AUTH = null;
  function getAuth() { return load(AUTH_KEY, true) || DEFAULT_AUTH; }
  function remembered() {
    if (ONLINE) return !!load("minise_api_token");
    return (+load("minise_admin_until") || 0) > Date.now();
  }
  function signedIn() {
    if (ONLINE) return !!TOKEN;
    try { if (sessionStorage.getItem("minise_admin_session") === "1") return true; } catch (e) { /* ignore */ }
    return remembered();
  }
  var loginMode = "signin", booted = false, lastActive = Date.now();
  function renderLogin() {
    document.documentElement.lang = lang;
    var create = loginMode === "create";
    var set = function (id, txt) { document.getElementById(id).textContent = txt; };
    set("lgLang", a("lang_switch")); set("lgKicker", a("lg_kicker"));
    set("loginTitle", create ? a("lg_create") : a("lg_welcome"));
    set("loginSub", create ? a("lg_create_sub") : a("lg_sub"));
    set("lgPassLabel", create ? a("lg_new_pass") : a("lg_pass"));
    document.getElementById("lgPass").autocomplete = create ? "new-password" : "current-password";
    document.getElementById("lgConfirmWrap").hidden = !create;
    set("lgConfirmLabel", a("lg_confirm")); set("lgRememberLabel", a("lg_remember"));
    set("lgBtn", create ? a("lg_save") : a("lg_signin"));
    set("lgForgot", a("lg_forgot")); document.getElementById("lgForgot").hidden = create;
    set("lgResetText", ONLINE ? a("lg_reset_online") : a("lg_reset_text")); set("lgResetBtn", a("lg_reset_btn")); set("loginNote", ONLINE ? a("lg_note_online") : a("lg_note"));
    document.getElementById("lgResetInput").hidden = ONLINE;
    document.getElementById("lgResetBtn").hidden = ONLINE;
    set("lgShow", document.getElementById("lgPass").type === "password" ? a("lg_show") : a("lg_hide"));
  }
  function showLogin(mode, msg) {
    loginMode = mode;
    document.body.classList.add("locked");
    var err = document.getElementById("lgErr");
    err.hidden = !msg; err.textContent = msg || "";
    document.getElementById("lgReset").hidden = true;
    document.getElementById("lgPass").value = "";
    document.getElementById("lgConfirm").value = "";
    renderLogin();
    setTimeout(function () { document.getElementById("lgPass").focus(); }, 50);
  }
  function loginError(msg) { var el = document.getElementById("lgErr"); el.textContent = msg; el.hidden = false; }
  function startSession(remember) {
    if (!ONLINE) {
      try { sessionStorage.setItem("minise_admin_session", "1"); } catch (e) { /* ignore */ }
      if (remember) store("minise_admin_until", String(Date.now() + 30 * 86400000));
    }
    document.body.classList.remove("locked");
    document.getElementById("lgErr").hidden = true;
    document.getElementById("lgPass").value = "";
    document.getElementById("lgConfirm").value = "";
    lastActive = Date.now();
    boot();
  }
  function logout(msg) {
    try { sessionStorage.removeItem("minise_admin_session"); } catch (e) { /* ignore */ }
    try { localStorage.removeItem("minise_admin_until"); } catch (e) { /* ignore */ }
    closeDialog(); closeDrawer();
    if (ONLINE) { setToken(""); showLogin("signin", msg); return; }
    showLogin(getAuth() ? "signin" : "create", msg);
  }
  // online: find out whether the Google Sheet already has a password before showing the form
  function onlineLogin(msg) {
    showLogin("signin", msg);
    api("status").then(function (res) {
      if (res && res.ok && !res.hasPassword) showLogin("create", msg);
    }, function () { loginError(a("lg_net")); });
  }
  function boot() {
    if (ONLINE) {
      render();
      loadCatalogOnline().then(pullOrders);
      if (!booted) {
        booted = true;
        setInterval(function () { if (!document.body.classList.contains("locked") && document.visibilityState !== "hidden") pullOrders(); }, 30000);
        document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && TOKEN) pullOrders(); });
        window.addEventListener("online", function () { if (TOKEN) pullOrders(); });
      }
      return;
    }
    if (booted) { render(); return; }
    booted = true;
    idb.get("dir").then(function (h) { if (h) { savedDir = h; renderHead(); } });
    render();
  }
  ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(function (ev) { document.addEventListener(ev, function () { lastActive = Date.now(); }, { passive: true }); });
  setInterval(function () {
    if (document.body.classList.contains("locked") || remembered()) return;
    var mins = +(load("minise_admin_autolock") || 30);
    if (mins && Date.now() - lastActive > mins * 60000) logout(a("al_locked"));
  }, 30000);
  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var pw = document.getElementById("lgPass").value;
    var remember = document.getElementById("lgRemember").checked;
    if (ONLINE) {
      if (loginMode === "create") {
        if (pw.length < 6) return loginError(a("lg_short"));
        if (pw !== document.getElementById("lgConfirm").value) return loginError(a("lg_mismatch"));
      }
      var lb = document.getElementById("lgBtn");
      lb.disabled = true;
      api(loginMode === "create" ? "setup" : "login", { password: pw, remember: remember }).then(function (res) {
        lb.disabled = false;
        if (res && res.ok) { setToken(res.token, remember); startSession(remember); return; }
        var err = res && res.error;
        if (err === "exists") showLogin("signin", a("lg_exists"));
        else if (err === "no_password") showLogin("create");
        else if (err === "too_many") loginError(a("lg_too_many"));
        else if (err === "short") loginError(a("lg_short"));
        else { loginError(a("lg_wrong")); document.getElementById("lgPass").select(); }
      }, function () { lb.disabled = false; loginError(a("lg_net")); });
      return;
    }
    if (loginMode === "create") {
      if (pw.length < 6) return loginError(a("lg_short"));
      if (pw !== document.getElementById("lgConfirm").value) return loginError(a("lg_mismatch"));
      var salt = randomSalt();
      sha256Hex(salt + ":" + pw).then(function (h) { store(AUTH_KEY, { salt: salt, hash: h, v: 1 }); startSession(remember); });
      return;
    }
    var auth = getAuth();
    if (!auth) { showLogin("create"); return; }
    sha256Hex(auth.salt + ":" + pw).then(function (h) {
      if (h === auth.hash) startSession(remember);
      else { loginError(a("lg_wrong")); document.getElementById("lgPass").select(); }
    });
  });
  document.getElementById("lgShow").addEventListener("click", function () {
    var inp = document.getElementById("lgPass"), conf = document.getElementById("lgConfirm");
    inp.type = conf.type = inp.type === "password" ? "text" : "password";
    renderLogin();
  });
  document.getElementById("lgForgot").addEventListener("click", function () { document.getElementById("lgReset").hidden = false; document.getElementById("lgResetInput").focus(); });
  document.getElementById("lgResetBtn").addEventListener("click", function () {
    if (document.getElementById("lgResetInput").value.trim() !== "RESET") { loginError(a("lg_reset_bad")); return; }
    try { localStorage.removeItem(AUTH_KEY); localStorage.removeItem("minise_admin_until"); } catch (e) { /* ignore */ }
    document.getElementById("lgResetInput").value = "";
    showLogin(getAuth() ? "signin" : "create");
  });
  document.getElementById("lgLang").addEventListener("click", function () { lang = lang === "en" ? "lo" : "en"; store("minise_admin_lang", lang); renderLogin(); });
  function changePassword() {
    var msg = document.getElementById("pwMsg");
    var show = function (txt, ok) { msg.textContent = txt; msg.className = "alert " + (ok ? "ok" : "warn"); msg.hidden = false; };
    var cur = document.getElementById("pwCur").value, n1 = document.getElementById("pwNew").value, n2 = document.getElementById("pwNew2").value;
    var auth = getAuth();
    if (n1.length < 6) return show(a("lg_short"));
    if (n1 !== n2) return show(a("lg_mismatch"));
    if (ONLINE) {
      var keep = remembered();
      api("password", { current: cur, next: n1, remember: keep }).then(function (res) {
        if (res && res.ok) { setToken(res.token, keep); document.getElementById("pwForm").reset(); show(a("pw_done"), true); }
        else show(res && res.error === "short" ? a("lg_short") : a("lg_wrong"));
      }, function () { show(a("lg_net")); });
      return;
    }
    (auth ? sha256Hex(auth.salt + ":" + cur) : Promise.resolve(null)).then(function (h) {
      if (auth && h !== auth.hash) return show(a("lg_wrong"));
      var salt = randomSalt();
      return sha256Hex(salt + ":" + n1).then(function (nh) {
        store(AUTH_KEY, { salt: salt, hash: nh, v: 1 });
        document.getElementById("pwForm").reset();
        show(a("pw_done"), true);
      });
    });
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var el;
    if (!e.target.closest(".gsearch")) document.getElementById("gres").hidden = true;
    if ((el = e.target.closest("[data-gi]"))) { openSearchItem(GS.items[+el.getAttribute("data-gi")]); return; }
    if ((el = e.target.closest("[data-tab]"))) { go(el.getAttribute("data-tab")); return; }
    if (e.target.closest("#adLang")) { lang = lang === "en" ? "lo" : "en"; store("minise_admin_lang", lang); render(); return; }
    if (e.target.closest("#connectBtn")) { if (savedDir && !dir) reconnect(); else connect(); return; }
    if (e.target.closest("#saveBtn")) { saveAll(); return; }
    if (e.target.closest("#logoutBtn")) { logout(); return; }
    if (e.target.closest("#onSync")) { SYNC.state = "wait"; render(); pullOrders(); return; }
    if (e.target.closest("#onWebFile")) { settings.api = API; download("settings.js", settingsFile(), "text/javascript;charset=utf-8"); return; }
    if (e.target.closest("#bkFiles")) {
      if (ONLINE) settings.api = API;
      download("products.js", productsFile(), "text/javascript;charset=utf-8");
      setTimeout(function () { download("settings.js", settingsFile(), "text/javascript;charset=utf-8"); }, 400);
      return;
    }
    if (e.target.closest("#onDisconnect")) {
      if (!confirm(a("on_disc_confirm"))) return;
      setToken(""); try { localStorage.removeItem("minise_api"); } catch (err) { /* ignore */ }
      dirty = 0; location.reload(); return;
    }
    if ((el = e.target.closest("[data-viewslip]"))) { showSlip(el.getAttribute("data-viewslip")); return; }
    if (e.target.closest("[data-closedlg]")) { closeDialog(); return; }
    if (e.target.closest("[data-closedr]") || e.target.id === "scrim") { closeDrawer(); return; }
    if ((el = e.target.closest("[data-period]"))) { setPreset(el.getAttribute("data-period")); render(); return; }
    if ((el = e.target.closest("[data-bestby]"))) { DF.by = el.getAttribute("data-bestby"); render(); return; }
    if ((el = e.target.closest("[data-goto]"))) {
      var g = el.getAttribute("data-goto").split(":");
      if (g[0] === "orders") { OF.stage = g[1]; OF.q = ""; OF.pay = "all"; OF.method = "all"; }
      if (g[0] === "products") { PF.status = g[1]; PF.q = ""; }
      if (g[0] === "stock") { SQ.f = g[1]; SQ.q = ""; }
      go(g[0]); return;
    }
    if ((el = e.target.closest("[data-dact]")) && DR) { drawerAction(el.getAttribute("data-dact")); return; }
    if ((el = e.target.closest("[data-bulk]"))) { bulkAction(el.getAttribute("data-bulk")); return; }
    if (e.target.closest(".cb")) return;
    if ((el = e.target.closest("[data-open]"))) { openDrawer(el.getAttribute("data-open")); return; }
    if ((el = e.target.closest("[data-ostage]"))) { OF.stage = el.getAttribute("data-ostage"); SEL = {}; render(); return; }
    if (e.target.closest("#pasteToggle")) { var pb = document.getElementById("pasteBox"); pb.hidden = !pb.hidden; if (!pb.hidden) document.getElementById("pasteMsg").focus(); return; }
    if (e.target.closest("#pasteBtn")) {
      var parsed = parseOrderMessage(document.getElementById("pasteMsg").value);
      if (!parsed) { toast(a("o_paste_fail"), 6000); return; }
      var existing = orderById(parsed.id);
      openOrderEditor(existing || parsed, !existing);
      return;
    }
    if (e.target.closest("#addOrder")) { openOrderEditor(blankOrder(), true); return; }
    if (e.target.closest("#exportCsv")) { exportCsv(); return; }
    if (e.target.closest("#addItem")) { document.getElementById("itemRows").insertAdjacentHTML("beforeend", itemRow({ name: "", qty: 1, details: "", price: 0 })); return; }
    if ((el = e.target.closest("[data-cust]"))) { OF.q = el.getAttribute("data-cust"); OF.stage = "all"; OF.pay = "all"; OF.method = "all"; go("orders"); return; }
    if ((el = e.target.closest("[data-pstatus]"))) { PF.status = el.getAttribute("data-pstatus"); render(); return; }
    if ((el = e.target.closest("[data-so]"))) { var p1 = products[+el.getAttribute("data-so")]; if (p1.so) delete p1.so; else p1.so = 1; markDirty(); render(); return; }
    if ((el = e.target.closest("[data-hid]"))) { var p2 = products[+el.getAttribute("data-hid")]; if (p2.hid) delete p2.hid; else p2.hid = 1; markDirty(); render(); return; }
    if ((el = e.target.closest("[data-edit]"))) { openEditor(+el.getAttribute("data-edit")); return; }
    if (e.target.closest("#addProduct")) { openEditor(-1); return; }
    if (e.target.closest("#addOpt")) { document.getElementById("optRows").insertAdjacentHTML("beforeend", optRow({ en: "", lo: "", price: 0 })); return; }
    if ((el = e.target.closest("[data-delrow]"))) { el.parentNode.remove(); return; }
    if ((el = e.target.closest("[data-phdel]")) && editing) { editing.img.splice(+el.getAttribute("data-phdel"), 1); document.getElementById("photoGrid").innerHTML = photoGrid(); return; }
    if ((el = e.target.closest("[data-phmove]")) && editing) {
      var i = +el.getAttribute("data-phmove"), j = i + +el.getAttribute("data-d");
      if (j >= 0 && j < editing.img.length) { var tmp = editing.img[i]; editing.img[i] = editing.img[j]; editing.img[j] = tmp; }
      document.getElementById("photoGrid").innerHTML = photoGrid(); return;
    }
    if (e.target.closest("#delProduct") && editingIndex >= 0) {
      if (confirm(a("e_del_confirm", { n: products[editingIndex].n }))) { products.splice(editingIndex, 1); closeDialog(); markDirty(); render(); }
      return;
    }
    if (e.target.closest("#dupProduct") && editing) {
      var copy = clone(editing);
      copy.n = copy.n + " " + a("e_copy"); copy.ig = []; copy.pc = 0; copy.lk = 0; copy.fp = copy.lp = todayISO(); delete copy.feat;
      closeDialog(); openEditor(-1, copy); return;
    }
    if ((el = e.target.closest("[data-tplreset]"))) {
      var k = el.getAttribute("data-tplreset");
      delete settings.templates[k];
      document.getElementById("tpl_" + k + "_en").value = AT["msg_" + k][0];
      document.getElementById("tpl_" + k + "_lo").value = AT["msg_" + k][1];
      markDirty(); return;
    }
    if (e.target.closest("#bkDownload")) { downloadBackup(); return; }
    if (e.target.closest("#dzClear")) {
      if (confirm(a("dz_confirm", { n: orders.length }))) { orders = []; SEL = {}; saveOrders(); render(); toast(a("dz_done")); }
      return;
    }
  });

  document.addEventListener("submit", function (e) {
    var id = e.target.id;
    if (id === "loginForm") return;
    e.preventDefault();
    if (id === "pform" && editing) {
      var errs = readEditor(), box = document.getElementById("perr");
      if (errs.length) { box.textContent = errs.join(" "); box.hidden = false; box.scrollIntoView({ block: "nearest" }); return; }
      if (editingIndex < 0) { editing.s = uniqueSlug(slugify(editing.n)); products.unshift(editing); }
      else products[editingIndex] = editing;
      closeDialog(); markDirty(); render();
    } else if (id === "oform" && editingOrder) {
      if (!readOrderEditor()) { var ob = document.getElementById("oerr"); ob.textContent = a("o_need"); ob.hidden = false; return; }
      var x = editingOrder.o, wasNew = editingOrder.isNew, ref = editingOrder.ref;
      if (wasNew) { if (!x.log.length) logEvent(x, a("log_created")); orders.push(x); }
      else { logEvent(x, a("log_edited")); orders[orders.indexOf(ref)] = x; if (DR && DR.id === ref.id) DR.id = x.id; }
      var pm = document.getElementById("pasteMsg"); if (pm && wasNew) pm.value = "";
      saveOrders(); closeDialog(); render(); toast(a("o_saved"));
    } else if (id === "onForm") connectOnline(document.getElementById("onUrl").value);
    else if (id === "pwForm") changePassword();
  });

  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "gq") { globalSearch(t.value); return; }
    if (t.id === "oq") { OF.q = t.value; renderOrderTable(); return; }
    if (t.id === "cq") { CF.q = t.value; renderCustomerTable(); return; }
    if (t.id === "pq") { PF.q = t.value; renderProductTable(); return; }
    if (t.id === "sq") { SQ.q = t.value; renderStockTable(); return; }
    var changed = false;
    if (t.closest("#sform")) {
      var key = t.getAttribute("data-set");
      if (key) { var l = +t.getAttribute("data-l"); if (key.indexOf("ann") === 0) settings.ann[+key.slice(3)][l] = t.value; else settings[key][l] = t.value; changed = true; }
      else if (t.id === "s_wa_main") { settings.wa.mainShow = t.value; changed = true; }
      else if (t.id === "s_wa_alt") { settings.wa.altShow = t.value; changed = true; }
      else if (t.id === "s_account") { settings.account = t.value; changed = true; }
    } else if (t.hasAttribute("data-tpl")) {
      var k = t.getAttribute("data-tpl"), cur = settings.templates[k] || [AT["msg_" + k][0], AT["msg_" + k][1]];
      cur[+t.getAttribute("data-l")] = t.value; settings.templates[k] = cur; changed = true;
    }
    if (changed) { if (!typedSettings) { typedSettings = true; markDirty(); } else renderHead(); }
  });

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "opay") { OF.pay = t.value; renderOrderTable(); return; }
    if (t.id === "omethod") { OF.method = t.value; renderOrderTable(); return; }
    if (t.id === "ptype") { PF.type = t.value; renderProductTable(); return; }
    if (t.id === "pstatus") { PF.status = t.value; render(); return; }
    if (t.id === "psort") { PF.sort = t.value; renderProductTable(); return; }
    if (t.id === "selAll") { oFiltered().forEach(function (o) { if (t.checked) SEL[o.id] = true; else delete SEL[o.id]; }); renderOrderTable(); return; }
    if (t.hasAttribute("data-sel")) { var sid = t.getAttribute("data-sel"); if (t.checked) SEL[sid] = true; else delete SEL[sid]; renderOrderTable(); return; }
    if (t.id === "dfFrom" || t.id === "dfTo") {
      if (t.value) { DF.preset = "custom"; if (t.id === "dfFrom") DF.from = t.value; else DF.to = t.value; if (DF.from > DF.to) { var sw = DF.from; DF.from = DF.to; DF.to = sw; } }
      render(); return;
    }
    if (t.hasAttribute("data-sw")) {
      var sp = products[+t.getAttribute("data-i")], key = t.getAttribute("data-sw");
      if (t.checked) delete sp[key]; else sp[key] = 1;
      markDirty(); return;
    }
    if (t.id === "alSel") { store("minise_admin_autolock", t.value); toast(a("al_saved")); return; }
    if (t.id === "rsFile") { if (t.files && t.files[0]) restoreBackup(t.files[0]); t.value = ""; return; }
    if (t.id === "e_photos" && editing) {
      var files = Array.prototype.slice.call(t.files || []);
      Promise.all(files.map(function (f) { return resizeImage(f, 1100, 0.8).catch(function () { return null; }); })).then(function (urls) {
        urls.forEach(function (u) { if (u) editing.img.push(u); });
        document.getElementById("photoGrid").innerHTML = photoGrid();
        t.value = "";
      });
      return;
    }
    if (t.id === "s_qr") {
      var f = t.files && t.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { settings.qr = reader.result; document.getElementById("qrPrev").src = reader.result; markDirty(); };
      reader.readAsDataURL(f);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (document.body.classList.contains("locked")) return;
    var tag = (e.target.tagName || "").toLowerCase();
    var typing = tag === "input" || tag === "textarea" || tag === "select";
    if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === "k")) { e.preventDefault(); document.getElementById("gq").focus(); return; }
    if (e.target.id === "gq") {
      var btns = document.querySelectorAll("#gres [data-gi]");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!btns.length) return;
        GS.sel = (GS.sel + (e.key === "ArrowDown" ? 1 : -1) + btns.length) % btns.length;
        btns.forEach(function (b, i) { b.classList.toggle("sel", i === GS.sel); });
        return;
      }
      if (e.key === "Enter" && GS.items.length) { e.preventDefault(); openSearchItem(GS.items[Math.max(0, GS.sel)]); return; }
      if (e.key === "Escape") { document.getElementById("gres").hidden = true; e.target.blur(); return; }
    }
    if (e.key === "Escape" && DR && !document.getElementById("dlg").open) closeDrawer();
  });

  window.addEventListener("beforeunload", function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = a("leave_warn"); return a("leave_warn"); }
  });
  window.addEventListener("afterprint", function () { document.getElementById("printArea").innerHTML = ""; });

  /* start: the admin opens only after signing in */
  if (ONLINE) {
    if (TOKEN) { document.body.classList.remove("locked"); boot(); }
    else onlineLogin();
  } else if (signedIn() && getAuth()) { document.body.classList.remove("locked"); boot(); }
  else showLogin(getAuth() ? "signin" : "create");
})();
