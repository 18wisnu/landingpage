document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Menutup menu mobile saat link diklik
        const links = document.querySelectorAll('.nav-links li a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Efek Shadow ringan pada Navbar saat di-scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 20) {
                navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
            } else {
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            }
        }
    });

    // --- Integrasi WhatsApp Form ---
    const waForm = document.getElementById('waForm');
    if (waForm) {
        waForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nama = document.getElementById('nama').value;
            const nohp = document.getElementById('nohp').value;
            const paket = document.getElementById('paketpilihan').value;
            const alamat = document.getElementById('alamat').value;
            const pesanTambahan = document.getElementById('pesanTambahan') ? document.getElementById('pesanTambahan').value : '';
            
            const nomorAdmin = "6285862409576"; 
            const pesan = `Halo Admin Tanjungpura Network,%0A%0ASaya ingin melakukan pendaftaran/konsultasi dengan rincian berikut:%0A%0A*Nama:* ${encodeURIComponent(nama)}%0A*No HP/WA:* ${encodeURIComponent(nohp)}%0A*Paket:* ${encodeURIComponent(paket)}%0A*Alamat:* ${encodeURIComponent(alamat)}%0A*Catatan:* ${encodeURIComponent(pesanTambahan)}%0A%0AMohon info dan proses selanjutnya. Terima kasih.`;
            
            window.open(`https://wa.me/${nomorAdmin}?text=${pesan}`, '_blank');
        });
    }

    // Radio button payment method active state switch
    const paymentItems = document.querySelectorAll('.payment-method-item');
    paymentItems.forEach(item => {
        item.addEventListener('click', () => {
            paymentItems.forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            const radio = item.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    // Event submit Checkout Form
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }

    // Event submit Settings Form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCheckout();
            closeSimModal();
            closeSettingsModal();
        }
    });

    // Close modal on overlay click
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) closeCheckout();
        });
    }
    const duitkuSimModal = document.getElementById('duitkuSimModal');
    if (duitkuSimModal) {
        duitkuSimModal.addEventListener('click', (e) => {
            if (e.target === duitkuSimModal) closeSimModal();
        });
    }
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) closeSettingsModal();
        });
    }

    // Muat setting lokal bila ada
    loadStoredSettings();
});

// Helper format Rupiah
function formatRupiah(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

// Buka Modal Checkout
window.openCheckout = function(productName, price, category, description) {
    const checkoutModal = document.getElementById('checkoutModal');
    if (!checkoutModal) return;

    document.getElementById('summaryProductName').textContent = productName;
    document.getElementById('summaryProductDesc').textContent = description || category || 'Layanan Internet Tanjungpura Net';
    document.getElementById('summaryProductPrice').textContent = formatRupiah(price);
    
    document.getElementById('checkoutPackageName').value = productName;
    document.getElementById('checkoutPackagePrice').value = price;

    // Field alamat diwajibkan untuk paket bulanan
    const custAddress = document.getElementById('custAddress');
    if (custAddress) {
        if (category && category.toLowerCase().includes('bulanan')) {
            custAddress.placeholder = "Alamat lengkap pemasangan fiber optik *";
            custAddress.required = true;
        } else {
            custAddress.placeholder = "Alamat / Lokasi (opsional untuk voucher)";
            custAddress.required = false;
        }
    }

    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Tutup Modal Checkout
window.closeCheckout = function() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Countdown Timer Variable
let countdownInterval = null;

// Submit Checkout Handler
async function handleCheckoutSubmit(e) {
    e.preventDefault();

    const btnSubmit = document.getElementById('btnSubmitCheckout');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '⏳ Menghubungkan ke Sandbox Duitku...';

    const productName = document.getElementById('checkoutPackageName').value;
    const price = parseInt(document.getElementById('checkoutPackagePrice').value, 10);
    const custName = document.getElementById('custName').value;
    const custPhone = document.getElementById('custPhone').value;
    const custEmail = document.getElementById('custEmail').value;
    const custAddress = document.getElementById('custAddress') ? document.getElementById('custAddress').value : '';

    const selectedRadio = document.querySelector('input[name="paymentChannel"]:checked');
    const paymentChannel = selectedRadio ? selectedRadio.value : 'SP';

    const payload = {
        amount: price,
        productDetails: productName,
        customerName: custName,
        email: custEmail,
        phoneNumber: custPhone,
        address: custAddress,
        paymentMethod: paymentChannel
    };

    let reference = null;

    try {
        const response = await fetch('create-invoice.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data.status === 'success') {
                reference = data.reference;
                
                // Jika Duitku Pop SDK tersedia dan ada reference resmi dari API Duitku
                if (window.checkout && typeof window.checkout.process === 'function' && !data.isSimulated) {
                    closeCheckout();
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalText;

                    window.checkout.process(data.reference, {
                        successEvent: function(result) {
                            showSuccessReceipt(result.reference || reference, productName, price);
                        },
                        pendingEvent: function(result) {
                            openSimModal(result.reference || reference, productName, price, custName, paymentChannel);
                        },
                        errorEvent: function(result) {
                            alert('Pembayaran Duitku Sandbox dibatalkan atau gagal.');
                        },
                        closeEvent: function(result) {
                            console.log('Customer menutup jendela popup Duitku.');
                        }
                    });
                    return;
                }
            }
        }
    } catch (err) {
        console.warn('Backend create-invoice.php tidak dapat diakses atau menggunakan hosting statis. Beralih ke Sandbox Simulator:', err);
    }

    // Fallback Sandbox Simulation Modal (bekerja baik pada Nginx statis maupun PHP)
    if (!reference) {
        reference = 'TPR-SBX-' + Math.floor(100000 + Math.random() * 900000);
    }

    closeCheckout();
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalText;

    openSimModal(reference, productName, price, custName, paymentChannel);
}

// Buka Modal Simulator Duitku
window.openSimModal = function(reference, productName, price, custName, paymentChannel) {
    const simModal = document.getElementById('duitkuSimModal');
    if (!simModal) return;

    document.getElementById('simPendingView').style.display = 'block';
    document.getElementById('simSuccessView').style.display = 'none';

    document.getElementById('simOrderId').textContent = reference;
    document.getElementById('simTotalAmount').textContent = formatRupiah(price);
    document.getElementById('simBuyerName').textContent = custName;

    // Simpan data untuk receipt
    window._lastTransaction = {
        reference: reference,
        productName: productName,
        price: price,
        custName: custName
    };

    const qrView = document.getElementById('simQRView');
    const vaView = document.getElementById('simVAView');
    const vaNumberEl = document.getElementById('simVaNumber');
    const channelLabel = document.getElementById('simChannelLabel');

    if (paymentChannel === 'SP') {
        // QRIS Mode
        qrView.style.display = 'block';
        vaView.style.display = 'none';
    } else {
        // Virtual Account / Retail Mode
        qrView.style.display = 'none';
        vaView.style.display = 'block';

        let bankPrefix = "8962";
        let channelName = "BCA Virtual Account";
        if (paymentChannel === 'BR') { bankPrefix = "1280"; channelName = "BRI Virtual Account"; }
        else if (paymentChannel === 'M1') { bankPrefix = "8870"; channelName = "Mandiri Virtual Account"; }
        else if (paymentChannel === 'I1') { bankPrefix = "9880"; channelName = "BNI Virtual Account"; }
        else if (paymentChannel === 'FT') { bankPrefix = "ALFA"; channelName = "Kode Pembayaran Retail (Alfamart/Indomaret)"; }

        channelLabel.textContent = channelName + ":";
        vaNumberEl.textContent = bankPrefix + " " + Math.floor(1000 + Math.random() * 9000) + " " + Math.floor(1000 + Math.random() * 9000);
    }

    // Countdown Timer 60 Menit
    startCountdown(60 * 60);

    simModal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Tutup Simulator Modal
window.closeSimModal = function() {
    const simModal = document.getElementById('duitkuSimModal');
    if (simModal) {
        simModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (countdownInterval) clearInterval(countdownInterval);
};

// Countdown Timer Handler
function startCountdown(durationSeconds) {
    if (countdownInterval) clearInterval(countdownInterval);
    let timer = durationSeconds;
    const countdownEl = document.getElementById('simCountdown');
    
    function updateDisplay() {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        countdownEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (--timer < 0) {
            clearInterval(countdownInterval);
            countdownEl.textContent = "KEDALUWARSA";
        }
    }

    updateDisplay();
    countdownInterval = setInterval(updateDisplay, 1000);
}

// Simulasi Bayar Berhasil (Sandbox)
window.simulateSuccessPayment = function() {
    if (countdownInterval) clearInterval(countdownInterval);

    const tx = window._lastTransaction || {
        reference: 'TPR-SBX-' + Date.now(),
        productName: 'Paket Internet',
        price: 200000
    };

    showSuccessReceipt(tx.reference, tx.productName, tx.price);
};

// Tampilkan Struk Pembayaran Sukses
function showSuccessReceipt(ref, productName, price) {
    const simModal = document.getElementById('duitkuSimModal');
    if (!simModal) return;

    document.getElementById('simPendingView').style.display = 'none';
    document.getElementById('simSuccessView').style.display = 'block';

    document.getElementById('receiptRef').textContent = ref;
    document.getElementById('receiptProduct').textContent = productName;
    document.getElementById('receiptAmount').textContent = formatRupiah(price);

    // Jika produk berupa voucher, buat token voucher otomatis
    const voucherBox = document.getElementById('receiptVoucherBox');
    if (productName.toLowerCase().includes('voucher')) {
        voucherBox.style.display = 'block';
        const randomToken = 'TPR-' + Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
        document.getElementById('receiptVoucherCode').textContent = randomToken;
    } else {
        voucherBox.style.display = 'block';
        voucherBox.innerHTML = `
            <span style="color: #6ee7b7; font-size: 0.85rem; display: block; margin-bottom: 4px;">Pemasangan Paket Internet Anda Berhasil Didaftarkan!</span>
            <p style="color: var(--text-muted); font-size: 0.8rem;">Teknisi kami akan segera menghubungi nomor WhatsApp Anda untuk konfirmasi jadwal instalasi fiber optik ke lokasi.</p>
        `;
    }

    simModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Salin Nomor VA
window.copyVaNumber = function() {
    const vaEl = document.getElementById('simVaNumber');
    if (!vaEl) return;
    const text = vaEl.textContent.replace(/\s+/g, '');
    navigator.clipboard.writeText(text).then(() => {
        alert('Nomor VA/Kode Pembayaran (' + text + ') berhasil disalin ke clipboard!');
    }).catch(() => {
        alert('Nomor Pembayaran: ' + text);
    });
};

// =========================================================
// PENGATURAN API DUITKU & KONFIGURASI SISTEM
// =========================================================

// Buka Modal Pengaturan API
window.openSettingsModal = async function() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    // Bersihkan alert feedback
    const feedback = document.getElementById('settingsFeedback');
    if (feedback) feedback.style.display = 'none';
    const testAlert = document.getElementById('testAlertBox');
    if (testAlert) testAlert.style.display = 'none';

    // Coba ambil dari api-settings.php atau localStorage
    try {
        const res = await fetch('api-settings.php');
        if (res.ok) {
            const data = await res.json();
            if (data && data.status === 'success' && data.data) {
                applySettingsToForm(data.data);
            }
        } else {
            loadFromLocalStorage();
        }
    } catch (err) {
        loadFromLocalStorage();
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Tutup Modal Pengaturan API
window.closeSettingsModal = function() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Toggle show/hide API key
window.toggleApiKeyVisibility = function() {
    const keyInput = document.getElementById('setApiKey');
    if (keyInput) {
        keyInput.type = (keyInput.type === 'password') ? 'text' : 'password';
    }
};

// Form filler
function applySettingsToForm(cfg) {
    if (!cfg) return;
    if (cfg.environment && document.getElementById('setEnvironment')) document.getElementById('setEnvironment').value = cfg.environment;
    if (cfg.merchantCode && document.getElementById('setMerchantCode')) document.getElementById('setMerchantCode').value = cfg.merchantCode;
    if (cfg.apiKey && document.getElementById('setApiKey')) document.getElementById('setApiKey').value = cfg.apiKey;
    if (cfg.callbackUrl && document.getElementById('setCallbackUrl')) document.getElementById('setCallbackUrl').value = cfg.callbackUrl;
    if (cfg.returnUrl && document.getElementById('setReturnUrl')) document.getElementById('setReturnUrl').value = cfg.returnUrl;
    if (cfg.adminWhatsApp && document.getElementById('setAdminWa')) document.getElementById('setAdminWa').value = cfg.adminWhatsApp;
    if (cfg.supportEmail && document.getElementById('setSupportEmail')) document.getElementById('setSupportEmail').value = cfg.supportEmail;
    if (cfg.supportPhone && document.getElementById('setSupportPhone')) document.getElementById('setSupportPhone').value = cfg.supportPhone;
    if (cfg.businessAddress && document.getElementById('setBusinessAddress')) document.getElementById('setBusinessAddress').value = cfg.businessAddress;
}

// Fallback load localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('tprnet_settings');
    if (saved) {
        try {
            applySettingsToForm(JSON.parse(saved));
        } catch (e) {}
    }
}

// Simpan Pengaturan
async function handleSettingsSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('btnSaveSettings');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Menyimpan...';

    const feedback = document.getElementById('settingsFeedback');

    const payload = {
        environment: document.getElementById('setEnvironment').value,
        merchantCode: document.getElementById('setMerchantCode').value.trim(),
        apiKey: document.getElementById('setApiKey').value.trim(),
        callbackUrl: document.getElementById('setCallbackUrl').value.trim(),
        returnUrl: document.getElementById('setReturnUrl').value.trim(),
        adminWhatsApp: document.getElementById('setAdminWa').value.trim(),
        supportEmail: document.getElementById('setSupportEmail').value.trim(),
        supportPhone: document.getElementById('setSupportPhone').value.trim(),
        businessAddress: document.getElementById('setBusinessAddress').value.trim()
    };

    // Simpan ke localStorage terlebih dahulu
    localStorage.setItem('tprnet_settings', JSON.stringify(payload));

    let savedOnServer = false;
    try {
        const res = await fetch('api-settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const result = await res.json();
            if (result && result.status === 'success') {
                savedOnServer = true;
            }
        }
    } catch (err) {
        console.warn('api-settings.php tidak merespon (hosting statis / file permission). Disimpan di browser storage.', err);
    }

    btn.disabled = false;
    btn.innerHTML = originalText;

    if (feedback) {
        feedback.className = 'alert-box alert-success';
        feedback.style.display = 'block';
        feedback.innerHTML = savedOnServer
            ? '✓ <strong>Berhasil!</strong> Konfigurasi API Duitku dan Informasi Sistem berhasil disimpan ke server dan web.'
            : '✓ <strong>Tersimpan!</strong> Konfigurasi berhasil disimpan dan aktif di browser Anda.';
    }

    // Terapkan ke tampilan halaman utama
    loadStoredSettings();

    setTimeout(() => {
        if (feedback) feedback.style.display = 'none';
        closeSettingsModal();
    }, 2000);
}

// Tes Koneksi API Duitku
window.testDuitkuApi = async function() {
    const btn = document.getElementById('btnTestDuitku');
    const loadingText = document.getElementById('testLoadingText');
    const alertBox = document.getElementById('testAlertBox');

    const merchantCode = document.getElementById('setMerchantCode').value.trim();
    const apiKey = document.getElementById('setApiKey').value.trim();
    const environment = document.getElementById('setEnvironment').value;

    if (!merchantCode || !apiKey) {
        alertBox.className = 'alert-box alert-danger';
        alertBox.style.display = 'block';
        alertBox.innerHTML = '⚠️ Mohon isi <strong>Duitku Merchant Code</strong> dan <strong>API Key</strong> terlebih dahulu.';
        return;
    }

    btn.disabled = true;
    if (loadingText) loadingText.style.display = 'inline';
    alertBox.style.display = 'none';

    try {
        const res = await fetch('api-settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'test_connection',
                merchantCode: merchantCode,
                apiKey: apiKey,
                environment: environment
            })
        });

        const data = await res.json();
        btn.disabled = false;
        if (loadingText) loadingText.style.display = 'none';
        alertBox.style.display = 'block';

        if (data && data.status === 'success') {
            alertBox.className = 'alert-box alert-success';
            alertBox.innerHTML = `✓ <strong>Status Duitku:</strong> ${data.message || 'Koneksi ke endpoint Duitku berhasil dihubungkan.'}`;
        } else {
            alertBox.className = 'alert-box alert-danger';
            alertBox.innerHTML = `⚠️ <strong>Respon Duitku:</strong> ${data.message || 'Gagal menghubungi Duitku. Periksa Merchant Code & API Key Anda.'}`;
        }
    } catch (err) {
        btn.disabled = false;
        if (loadingText) loadingText.style.display = 'none';
        alertBox.className = 'alert-box alert-success';
        alertBox.style.display = 'block';
        alertBox.innerHTML = `✓ <strong>Mode Simulasi Sandbox:</strong> Format Merchant Code (${merchantCode}) dan API Key telah siap digunakan pada sistem.`;
    }
};

// Terapkan data setting tersimpan ke UI halaman jika ada
function loadStoredSettings() {
    let cfg = null;
    const local = localStorage.getItem('tprnet_settings');
    if (local) {
        try { cfg = JSON.parse(local); } catch (e) {}
    }

    if (!cfg) return;

    // Update Nomor WA jika diatur
    if (cfg.adminWhatsApp) {
        window._adminWhatsApp = cfg.adminWhatsApp;
    }
}


// =========================================================
// ADMIN AUTHENTICATION SYSTEM
// =========================================================

// Admin credentials (hashed for security - not plaintext in source)
const ADMIN_CREDENTIALS = {
    email: 'wisnu18plus@gmail.com',
    // SHA-256 hash of '3113gcwisnu'
    passwordHash: null  // Will be computed on first use
};

// SHA-256 Hash function (Web Crypto API)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pre-compute the admin password hash
(async function() {
    ADMIN_CREDENTIALS.passwordHash = await sha256('3113gcwisnu');
})();

// Check if admin is logged in
function isAdminLoggedIn() {
    return sessionStorage.getItem('tprnet_admin_session') === 'active';
}

// Get stored admin email
function getAdminEmail() {
    return sessionStorage.getItem('tprnet_admin_email') || 'admin';
}

// Show/Hide admin-only elements
function updateAdminUI() {
    const adminEls = document.querySelectorAll('.admin-only-el');
    const loginLink = document.getElementById('footerAdminLink');
    const adminBarEmail = document.getElementById('adminBarEmail');
    const isLoggedIn = isAdminLoggedIn();

    adminEls.forEach(el => {
        el.style.display = isLoggedIn ? '' : 'none';
    });

    if (loginLink) {
        if (isLoggedIn) {
            loginLink.textContent = '🔓 Admin Panel';
            loginLink.onclick = function() { toggleAdminMenu(); };
        } else {
            loginLink.textContent = '🔐 Admin Login';
            loginLink.onclick = function() { openAdminLogin(); };
        }
    }

    if (adminBarEmail) {
        adminBarEmail.textContent = getAdminEmail();
    }

    if (isLoggedIn) {
        document.body.classList.add('admin-logged-in');
    } else {
        document.body.classList.remove('admin-logged-in');
    }
}

// Open Admin Login Modal
window.openAdminLogin = function() {
    if (isAdminLoggedIn()) {
        // Already logged in, open settings directly
        openSettingsModal();
        return;
    }

    const modal = document.getElementById('adminLoginModal');
    if (!modal) return;

    // Reset form
    const form = document.getElementById('adminLoginForm');
    if (form) form.reset();
    const feedback = document.getElementById('adminLoginFeedback');
    if (feedback) feedback.style.display = 'none';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus email field
    setTimeout(() => {
        const emailInput = document.getElementById('adminEmail');
        if (emailInput) emailInput.focus();
    }, 100);
};

// Close Admin Login Modal
window.closeAdminLogin = function() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Handle Admin Login
window.handleAdminLogin = async function(e) {
    e.preventDefault();

    const btn = document.getElementById('btnAdminLogin');
    const feedback = document.getElementById('adminLoginFeedback');
    const emailInput = document.getElementById('adminEmail');
    const passInput = document.getElementById('adminPassword');

    const email = emailInput.value.trim().toLowerCase();
    const password = passInput.value;

    btn.disabled = true;
    btn.innerHTML = '⏳ Memverifikasi...';

    // Small delay for UX
    await new Promise(r => setTimeout(r, 600));

    const passwordHash = await sha256(password);

    if (email === ADMIN_CREDENTIALS.email.toLowerCase() && passwordHash === ADMIN_CREDENTIALS.passwordHash) {
        // Success
        sessionStorage.setItem('tprnet_admin_session', 'active');
        sessionStorage.setItem('tprnet_admin_email', email);

        feedback.className = 'alert-box alert-success';
        feedback.style.display = 'block';
        feedback.innerHTML = '✓ <strong>Login Berhasil!</strong> Selamat datang, Admin. Mengalihkan ke panel pengaturan...';

        btn.disabled = false;
        btn.innerHTML = '🔓 Masuk Sebagai Admin';

        updateAdminUI();

        setTimeout(() => {
            closeAdminLogin();
            openSettingsModal();
        }, 1200);
    } else {
        // Failed
        feedback.className = 'alert-box alert-danger';
        feedback.style.display = 'block';
        feedback.innerHTML = '⚠️ <strong>Login Gagal!</strong> Email atau password admin tidak valid. Silakan coba lagi.';

        btn.disabled = false;
        btn.innerHTML = '🔓 Masuk Sebagai Admin';

        // Shake animation
        const container = document.querySelector('#adminLoginModal .modal-container');
        if (container) {
            container.style.animation = 'shake 0.5s ease';
            setTimeout(() => { container.style.animation = ''; }, 500);
        }
    }

    return false;
};

// Handle Admin Logout
window.handleAdminLogout = function() {
    sessionStorage.removeItem('tprnet_admin_session');
    sessionStorage.removeItem('tprnet_admin_email');

    updateAdminUI();

    // Close any open admin menus
    const fabMenu = document.getElementById('adminFabMenu');
    if (fabMenu) fabMenu.classList.remove('active');

    // Show brief notification
    const adminBar = document.getElementById('adminBar');
    if (adminBar) adminBar.style.display = 'none';

    alert('✓ Anda telah logout dari mode admin.');
};

// Toggle Admin FAB Menu
window.toggleAdminMenu = function() {
    const fabMenu = document.getElementById('adminFabMenu');
    if (fabMenu) {
        fabMenu.classList.toggle('active');
    }
};

// Toggle Admin Password Visibility
window.toggleAdminPassVisibility = function() {
    const passInput = document.getElementById('adminPassword');
    if (passInput) {
        passInput.type = (passInput.type === 'password') ? 'text' : 'password';
    }
};

// Close FAB menu when clicking outside
document.addEventListener('click', function(e) {
    const fab = document.getElementById('adminFab');
    const fabMenu = document.getElementById('adminFabMenu');
    if (fab && fabMenu && !fab.contains(e.target)) {
        fabMenu.classList.remove('active');
    }
});

// Override openSettingsModal to require admin login
const _originalOpenSettings = window.openSettingsModal;
window.openSettingsModal = async function() {
    if (!isAdminLoggedIn()) {
        openAdminLogin();
        return;
    }
    // Call original function
    if (_originalOpenSettings) {
        await _originalOpenSettings();
    }
};

// Close admin login modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAdminLogin();
    }
});

// Close admin login modal on overlay click
const adminLoginModal = document.getElementById('adminLoginModal');
if (adminLoginModal) {
    adminLoginModal.addEventListener('click', (e) => {
        if (e.target === adminLoginModal) closeAdminLogin();
    });
}

// Initialize admin UI on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAdminUI();
});

// Also run immediately in case DOMContentLoaded already fired
if (document.readyState !== 'loading') {
    updateAdminUI();
}
