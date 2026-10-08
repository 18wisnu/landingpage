document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

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

    // Efek Shadow ringan pada Navbar saat di-scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        }
    });
    // --- Integrasi WhatsApp Form ---
    const waForm = document.getElementById('waForm');
    if (waForm) {
        waForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Mencegah form me-refresh halaman
            
            // Ambil data dari form
            const nama = document.getElementById('nama').value;
            const nohp = document.getElementById('nohp').value;
            const paket = document.getElementById('paketpilihan').value;
            const alamat = document.getElementById('alamat').value;
            
            // ---------------------------------------------------------
            // PENGATURAN NOMOR WA (Ubah bagian ini)
            // ---------------------------------------------------------
            // Ganti angka di bawah ini dengan nomor WhatsApp Admin Anda.
            // WAJIB gunakan kode negara "62" di awal, tanpa "+" dan tanpa "0".
            // Contoh jika nomor Anda 0812-3456-7890, tulis: 6281234567890
            const nomorAdmin = "6285862409576"; 
            
            // Template Pesan yang akan masuk ke WA
            const pesan = `Halo Admin Tanjungpura Network,%0A%0ASaya ingin melakukan pendaftaran dengan rincian berikut:%0A%0A*Nama:* ${nama}%0A*No HP/WA Aktif:* ${nohp}%0A*Kebutuhan:* ${paket}%0A*Alamat:* ${alamat}%0A%0AMohon bantuan dan arahannya. Terima kasih.`;
            
            // Proses membuka WhatsApp
            window.open(`https://wa.me/${nomorAdmin}?text=${pesan}`, '_blank');
        });
    }
    
});

