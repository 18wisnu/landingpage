# Tanjungpura Network — Landing Page

Landing page statis (HTML/CSS/JS). **Tidak ada checkout di website ini.**
Semua transaksi diproses di Portal Pelanggan Mixradius dan dibayar via Duitku:

| Tombol di landing page | Tujuan |
|---|---|
| Beli Voucher (paket hotspot) | https://gayatricorp.mixradius.com/evoucher |
| Daftar & Berlangganan (paket bulanan) | https://gayatricorp.mixradius.com/register |
| Bayar Tagihan / Portal Pelanggan | https://gayatricorp.mixradius.com/login |

Isi folder `public/` adalah web root. Harga di `public/index.html` harus sama dengan
paket yang aktif di Mixradius.

## Deploy (Docker)

```bash
docker compose up -d --build     # nginx di port 8080
```

Arahkan domain `tanjungpuranet.itturbo.my.id` ke port 8080 lewat reverse proxy ber-HTTPS
(Nginx Proxy Manager / Caddy / Cloudflare Tunnel).

## Preview lokal

```bash
php -S localhost:8099 -t public    # atau buka lewat Laragon
```
