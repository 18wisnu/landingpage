document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
        document.querySelectorAll('.nav-links li a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // Shadow navbar saat scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (navbar) {
            navbar.style.boxShadow = window.scrollY > 20
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : '0 2px 10px rgba(0,0,0,0.1)';
        }
    });

    // Form kontak -> WhatsApp
    const waForm = document.getElementById('waForm');
    if (waForm) {
        waForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = (id) => (document.getElementById(id) || {}).value || '';
            const nomorAdmin = '6285862409576';
            const pesan = 'Halo Admin Tanjungpura Network,\n\n'
                + 'Saya ingin melakukan pendaftaran/konsultasi dengan rincian berikut:\n\n'
                + '*Nama:* ' + val('nama') + '\n'
                + '*No HP/WA:* ' + val('nohp') + '\n'
                + '*Paket:* ' + val('paketpilihan') + '\n'
                + '*Alamat:* ' + val('alamat') + '\n'
                + '*Catatan:* ' + val('pesanTambahan') + '\n\n'
                + 'Mohon info dan proses selanjutnya. Terima kasih.';
            window.open('https://wa.me/' + nomorAdmin + '?text=' + encodeURIComponent(pesan), '_blank');
        });
    }

});

