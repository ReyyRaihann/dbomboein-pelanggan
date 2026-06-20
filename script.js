// =============================================
// CLOUDINARY CONFIG
// =============================================

const CLOUDINARY_CLOUD  = "dcrtgdl1n";
const CLOUDINARY_PRESET = "dbomboein";

async function uploadGambar(file){
    let formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    let res  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
        { method: "POST", body: formData }
    );
    let data = await res.json();
    if(data.error){ throw new Error(data.error.message); }
    return data.secure_url;
}

// =============================================
// SUPABASE CONFIG
// =============================================

const SUPABASE_URL = "https://kumhvdqlyibqiyaonmyk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1bWh2ZHFseWlicWl5YW9ubXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTgzNzYsImV4cCI6MjA5NzQzNDM3Nn0.6bdxzyw3CQM-IIfu7eu3-LmS1Kpk6isFbDuNib4-Noc";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
// DATA PRODUK DEFAULT
// =============================================

const produkDefault = [
    {nama:"Kemiri",       tipe:"berat",  harga:{ons:5000,perempat:12500,setengah:25000,kg:50000}, gambar:""},
    {nama:"Sahang",       tipe:"berat",  harga:{ons:20000,perempat:45000,setengah:90000,kg:180000}, gambar:""},
    {nama:"Cabe Bubuk",   tipe:"berat",  harga:{ons:10000,perempat:20000,setengah:40000,kg:80000}, gambar:""},
    {nama:"Kayu Manis",   tipe:"berat",  harga:{ons:10000,perempat:20000,setengah:40000,kg:80000}, gambar:""},
    {nama:"Bumbu Rendang Merah", tipe:"berat", harga:{perempat:20000,setengah:40000,kg:80000}, gambar:""},
    {nama:"Bumbu Rendang Hitam", tipe:"berat", harga:{perempat:25000,setengah:50000,kg:100000}, gambar:""},
    {nama:"Bumbu Babas",  tipe:"satuan", harga:{satuan:35000}, satuan:"bungkus", gambar:""},
    {nama:"Bumbu Adabi",  tipe:"satuan", harga:{satuan:30000}, satuan:"bungkus", gambar:""},
    {nama:"Bumbu Nasi Merah",  tipe:"berat", harga:{ons:5000,perempat:25000,setengah:50000,kg:100000}, gambar:""},
    {nama:"Bumbu Nasi Kuning", tipe:"berat", harga:{ons:5000,perempat:25000,setengah:50000,kg:100000}, gambar:""},
    {nama:"Bumbu Nasi Merah (1 Pak)",  tipe:"pak", harga:{satuan:40000}, keterangan:"isi 12", gambar:""},
    {nama:"Bumbu Nasi Kuning (1 Pak)", tipe:"pak", harga:{satuan:60000}, keterangan:"isi 20", gambar:""},
    {nama:"Kecap ABC Dirigen",  tipe:"satuan", harga:{satuan:165000}, satuan:"dirigen", gambar:""},
    {nama:"Saus ABC Dirigen",   tipe:"satuan", harga:{satuan:165000}, satuan:"dirigen", gambar:""},
    {nama:"Tomat ABC Dirigen",  tipe:"satuan", harga:{satuan:140000}, satuan:"dirigen", gambar:""},
    {nama:"Bango Dirigen",      tipe:"satuan", harga:{satuan:195000}, satuan:"dirigen", gambar:""},
    {nama:"Saus Tiram",         tipe:"satuan", harga:{satuan:60000},  satuan:"botol",   gambar:""},
    {nama:"Blue Band Kaleng",   tipe:"satuan", harga:{satuan:150000}, satuan:"kaleng",  gambar:""},
    {nama:"Minyak Samin Onta",  tipe:"satuan", harga:{satuan:185000}, satuan:"kaleng",  gambar:""},
    {nama:"Ajinomoto",          tipe:"satuan", harga:{satuan:60000},  satuan:"bungkus (1kg)", gambar:""},
    {nama:"Pasta Pandan Besar",     tipe:"satuan", harga:{satuan:15000}, satuan:"botol", gambar:""},
    {nama:"Pasta Pandan Kupu-Kupu", tipe:"satuan", harga:{satuan:10000}, satuan:"botol", gambar:""},
    {nama:"Cuka Dixi Besar",  tipe:"satuan", harga:{satuan:20000}, satuan:"botol", gambar:""},
    {nama:"Cuka Dixi Sedang", tipe:"satuan", harga:{satuan:10000}, satuan:"botol", gambar:""},
    {nama:"Cuka Dixi Kecil",  tipe:"satuan", harga:{satuan:5000},  satuan:"botol", gambar:""},
];

let keranjang = JSON.parse(localStorage.getItem("keranjang")) || [];
let stokCache = {};

// =============================================
// HELPER
// =============================================

function formatRp(n){ return "Rp " + Number(n).toLocaleString('id-ID'); }

function getPilihan(item){
    if(item.tipe === "berat"){
        let opts = [];
        if(item.harga.ons      !== undefined) opts.push({label:"1 ons (100g)",  nilai:100,  harga:item.harga.ons});
        if(item.harga.perempat !== undefined) opts.push({label:"1/4 kg (250g)", nilai:250,  harga:item.harga.perempat});
        if(item.harga.setengah !== undefined) opts.push({label:"1/2 kg (500g)", nilai:500,  harga:item.harga.setengah});
        if(item.harga.kg       !== undefined) opts.push({label:"1 kg (1000g)",  nilai:1000, harga:item.harga.kg});
        return opts;
    } else {
        let label = item.tipe === "pak"
            ? `1 pak (${item.keterangan || ""})`
            : `1 ${item.satuan || "pcs"}`;
        return [{label, nilai:1, harga:item.harga.satuan}];
    }
}

function simpanData(){ localStorage.setItem("keranjang", JSON.stringify(keranjang)); }

function updateJumlahItem(){
    let el = document.getElementById("jumlahItem");
    if(el) el.innerText = keranjang.length;
}

function showLoading(msg="Memuat..."){
    let el = document.getElementById("loadingInfo");
    if(el){ el.innerText = msg; el.style.display = "block"; }
}

function hideLoading(){
    let el = document.getElementById("loadingInfo");
    if(el) el.style.display = "none";
}

// =============================================
// SUPABASE — PRODUK & STOK
// =============================================

async function getProdukAll(){
    let { data, error } = await db.from("produk").select("*").order("id");
    if(error || !data || data.length === 0) return produkDefault;
    return data;
}

async function getStokAll(){
    let { data, error } = await db.from("stok").select("*");
    if(error || !data) return {};
    let result = {};
    data.forEach(row => { result[row.nama_produk] = row.jumlah; });
    return result;
}

async function updateStok(nama, jumlahBaru){
    await db.from("stok").upsert(
        { nama_produk: nama, jumlah: jumlahBaru },
        { onConflict: "nama_produk" }
    );
}

async function resetProdukAwal(){
    if(!confirm("Reset semua produk ke data awal?")) return;
    showLoading("Mereset produk...");
    await db.from("produk").delete().neq("id", 0);
    await db.from("stok").delete().neq("id", 0);
    for(let p of produkDefault){
        await db.from("produk").insert({
            nama: p.nama, tipe: p.tipe, harga: p.harga,
            gambar: p.gambar || "",
            satuan: p.satuan || null,
            keterangan: p.keterangan || null
        });
        await db.from("stok").insert({
            nama_produk: p.nama,
            jumlah: p.tipe === "berat" ? 10000 : 20
        });
    }
    hideLoading();
    alert("Produk berhasil dipulihkan!");
    await loadAdminStok();
    await loadProdukTambahan();
}

// =============================================
// HALAMAN PRODUK (INDEX)
// =============================================

async function loadProdukTambahan(){
    let container = document.getElementById("produkContainer");
    if(!container) return;
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;grid-column:1/-1;">Memuat produk...</div>`;

    let produk = await getProdukAll();
    stokCache  = await getStokAll();
    container.innerHTML = "";

    produk.forEach((item, index) => {
        let pilihan = getPilihan(item);
        let stokAda = stokCache[item.nama] || 0;
        let habis   = stokAda <= 0;

        let optionsHtml = pilihan.map((p,i) =>
            `<option value="${i}">${p.label} — ${formatRp(p.harga)}</option>`
        ).join("");

        let stokTeks = habis
            ? `<span style="color:red;font-weight:bold">Stok Habis</span>`
            : item.tipe === "berat"
                ? (stokAda >= 1000 ? `Stok : ${stokAda/1000} Kg` : `Stok : ${stokAda} gram`)
                : `Stok : ${stokAda} ${item.satuan || "pcs"}`;

        let div = document.createElement("div");
        div.className = "item" + (habis ? " stok-habis" : "");
        div.setAttribute("data-nama", item.nama);
        div.innerHTML = `
            <img src="${item.gambar || 'https://placehold.co/300x200/f5f5f5/999?text=Produk'}"
                 alt="${item.nama}" class="gambar-produk"
                 onerror="this.src='https://placehold.co/300x200/f5f5f5/999?text=Produk'">
            <h3>${item.nama}</h3>
            <p class="stok-text">${stokTeks}</p>
            <select id="pilih${index}">${optionsHtml}</select>
            <button class="btn-tambah"
                onclick="tambahKeranjang('${item.nama}','pilih${index}')"
                ${habis ? "disabled style='background:#ccc;cursor:not-allowed'" : ""}>
                ${habis ? "Stok Habis" : "Masuk Keranjang"}
            </button>`;
        container.appendChild(div);
    });
}

function cariProduk(){
    let input = document.getElementById("searchInput").value.toLowerCase();
    document.querySelectorAll("#produkContainer .item").forEach(item => {
        let nama = item.querySelector("h3").innerText.toLowerCase();
        item.style.display = nama.includes(input) ? "block" : "none";
    });
}

// =============================================
// KERANJANG
// =============================================

function keKeranjang(){ window.location.href = "keranjang.html"; }
function keRiwayat(){   window.location.href = "riwayat.html"; }
function kembali(){     window.location.href = "index.html"; }

async function tambahKeranjang(nama, idSelect){
    let produk = await getProdukAll();
    let item   = produk.find(p => p.nama === nama);
    if(!item) return;

    let pilihan = getPilihan(item);
    let idx     = parseInt(document.getElementById(idSelect)?.value ?? 0);
    let pilih   = pilihan[idx];
    if(!pilih) return;

    let stokAda = stokCache[nama] || 0;
    if(stokAda <= 0){ alert("Stok habis!"); return; }
    if(item.tipe === "berat" && stokAda < pilih.nilai){
        alert("Stok tidak mencukupi! Sisa: " + stokAda + "g"); return;
    }

    keranjang.push({
        nama,
        pilihan: pilih.label,
        berat:   item.tipe === "berat" ? pilih.nilai : "-",
        harga:   pilih.harga,
        tipe:    item.tipe
    });

    simpanData();
    updateJumlahItem();

    let btn = document.querySelector(`[data-nama="${nama}"] .btn-tambah`);
    if(btn){
        btn.innerText = "✓ Ditambahkan!";
        setTimeout(() => { btn.innerText = "Masuk Keranjang"; }, 1000);
    }
}

function hapusItem(index){
    keranjang.splice(index, 1);
    simpanData();
    loadKeranjang();
    updateJumlahItem();
}

function loadKeranjang(){
    keranjang = JSON.parse(localStorage.getItem("keranjang")) || [];
    let list  = document.getElementById("keranjang");
    let total = 0;
    if(!list) return;
    list.innerHTML = "";

    if(keranjang.length === 0){
        list.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;">
            <div style="font-size:48px">🛒</div>
            <p>Keranjang masih kosong</p></div>`;
    }

    keranjang.forEach((item, index) => {
        let div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <div class="cart-info">
                <h4>${item.nama}</h4>
                <p>${item.pilihan || item.berat + " gram"}</p>
            </div>
            <div class="cart-item-right">
                <span class="cart-price">${formatRp(item.harga)}</span>
                <button class="hapus-btn" onclick="hapusItem(${index})">🗑 Hapus</button>
            </div>`;
        list.appendChild(div);
        total += item.harga;
    });

    let totalEl = document.getElementById("total");
    if(totalEl) totalEl.innerText = formatRp(total);
}

// =============================================
// CHECKOUT
// =============================================

async function checkout(){
    let nama   = document.getElementById("nama")?.value.trim();
    let alamat = document.getElementById("alamat")?.value.trim();
    let nohp   = document.getElementById("nohp")?.value.trim();
    let metode = document.getElementById("metode")?.value;

    if(!nama || !alamat || !nohp){ alert("Lengkapi data dulu!"); return; }
    if(keranjang.length === 0){ alert("Keranjang kosong!"); return; }

    let total = keranjang.reduce((s, i) => s + i.harga, 0);

    let { error } = await db.from("pesanan").insert({
        order_id: "ORD" + Date.now(),
        tanggal:  new Date().toLocaleString(),
        nama, alamat, nohp, metode, total,
        status: "Diproses",
        items:  keranjang
    });

    if(error){ alert("Gagal menyimpan pesanan, coba lagi!"); return; }

    for(let item of keranjang){
        let kurang   = item.tipe === "berat" ? parseInt(item.berat) : 1;
        let stokBaru = Math.max(0, (stokCache[item.nama] || 0) - kurang);
        await updateStok(item.nama, stokBaru);
        stokCache[item.nama] = stokBaru;
    }

    let pesan = `Halo, saya ingin memesan:%0A`;
    keranjang.forEach(item => {
        pesan += `- ${item.nama} (${item.pilihan || item.berat+"g"}) : ${formatRp(item.harga)}%0A`;
    });
    pesan += `%0ATotal: ${formatRp(total)}%0A`;
    pesan += `Nama: ${nama}%0AAlamat: ${alamat}%0ANo HP: ${nohp}%0AMetode: ${metode}`;

    window.open(`https://wa.me/6285378445758?text=${pesan}`, "_blank");

    keranjang = [];
    simpanData();
    loadKeranjang();
    updateJumlahItem();
    alert("Pesanan berhasil! Silakan lanjutkan di WhatsApp.");
}

// =============================================
// RIWAYAT
// =============================================

async function loadRiwayat(){
    let container = document.getElementById("riwayatList");
    if(!container) return;
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;">Memuat riwayat...</div>`;
    let { data } = await db.from("pesanan").select("*").order("id", {ascending:false});
    renderRiwayat(data || [], container, data || []);
}

function renderRiwayat(data, container, semua){
    container.innerHTML = "";
    if(data.length === 0){
        container.innerHTML = `<div style="text-align:center;padding:60px;color:#aaa;">
            <div style="font-size:40px">🔍</div><p>Tidak ada pesanan</p></div>`;
        return;
    }
    data.forEach(order => {
        let progress = order.status==="Diproses"?33:order.status==="Dikirim"?66:100;
        let itemsText = (order.items||[]).map(i =>
            `<span>🌿 ${i.nama} (${i.pilihan||i.berat+"g"})</span>`).join("");
        let div = document.createElement("div");
        div.className = "riwayat-item";
        div.innerHTML = `
            <div class="riwayat-header">
                <span class="riwayat-id">📋 ${order.order_id}</span>
                <span class="riwayat-tanggal">🕐 ${order.tanggal}</span>
            </div>
            <div class="riwayat-body">
                <div><span>Nama</span><br><strong>${order.nama}</strong></div>
                <div><span>Metode</span><br><strong>${order.metode}</strong></div>
                <div><span>Alamat</span><br><strong>${order.alamat}</strong></div>
                <div><span>No HP</span><br><strong>${order.nohp}</strong></div>
            </div>
            <div class="riwayat-produk">${itemsText}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:8px;">
                <span class="riwayat-total">${formatRp(order.total)}</span>
                <span class="badge-status badge-${order.status}">${order.status}</span>
            </div>
            <div class="progress-label"><span>Diproses</span><span>Dikirim</span><span>Selesai</span></div>
            <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
            <div class="riwayat-actions">
                <button class="btn-pesan-lagi" onclick='pesanLagi(${JSON.stringify(order.items)})'>🔄 Pesan Lagi</button>
                <button class="btn-hapus-riwayat" onclick="hapusRiwayat('${order.order_id}')">🗑️ Hapus</button>
            </div>`;
        container.appendChild(div);
    });
}

async function filterStatus(status){
    let container = document.getElementById("riwayatList");
    if(!container) return;
    let { data } = await db.from("pesanan").select("*").order("id", {ascending:false});
    let semua    = data || [];
    let filtered = status === "all" ? semua : semua.filter(o => o.status === status);
    renderRiwayat(filtered, container, semua);
}

async function hapusRiwayat(orderId){
    if(!confirm("Hapus pesanan ini?")) return;
    await db.from("pesanan").delete().eq("order_id", orderId);
    loadRiwayat();
}

function pesanLagi(items){
    let k = JSON.parse(localStorage.getItem("keranjang")) || [];
    items.forEach(item => k.push(item));
    localStorage.setItem("keranjang", JSON.stringify(k));
    alert("Produk dimasukkan ke keranjang!");
    window.location.href = "keranjang.html";
}

// =============================================
// ADMIN - PESANAN
// =============================================

async function loadAdminPesanan(){
    let container = document.getElementById("adminPesanan");
    if(!container) return;
    container.innerHTML = `<div style="padding:20px;color:#aaa;">Memuat pesanan...</div>`;
    let { data } = await db.from("pesanan").select("*").order("id", {ascending:false});
    if(!data || data.length === 0){
        container.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;">Belum ada pesanan</div>`;
        return;
    }
    container.innerHTML = "";
    data.forEach(order => {
        let warna = order.status==="Dikirim"?"blue":order.status==="Selesai"?"green":"orange";
        let itemsText = (order.items||[]).map(i=>
            `<small>• ${i.nama} (${i.pilihan||i.berat+"g"}) — ${formatRp(i.harga)}</small>`).join("<br>");
        let div = document.createElement("div");
        div.className = "riwayat-item";
        div.innerHTML = `
            <h3>${order.nama}</h3>
            <p><b>ID:</b> ${order.order_id}</p>
            <p><b>Tanggal:</b> ${order.tanggal}</p>
            <p><b>Alamat:</b> ${order.alamat}</p>
            <p><b>No HP:</b> ${order.nohp}</p>
            <p><b>Metode:</b> ${order.metode}</p>
            <div style="margin:8px 0;line-height:2;">${itemsText}</div>
            <p><b>Total:</b> ${formatRp(order.total)}</p>
            <p><b>Status:</b> <span style="color:${warna};font-weight:bold">${order.status}</span></p>
            <button onclick="nextStatusAdmin('${order.order_id}','${order.status}')"
                style="margin-top:8px;background:#1976d2">🔄 Update Status</button>`;
        container.appendChild(div);
    });
}

async function nextStatusAdmin(orderId, statusSaat){
    let statusBaru = statusSaat==="Diproses"?"Dikirim":statusSaat==="Dikirim"?"Selesai":"Selesai";
    await db.from("pesanan").update({status: statusBaru}).eq("order_id", orderId);
    loadAdminPesanan();
}

// =============================================
// ADMIN - STOK & PRODUK
// =============================================

async function loadAdminStok(){
    let container = document.getElementById("adminStok");
    if(!container) return;
    container.innerHTML = `<div style="padding:20px;color:#aaa;grid-column:1/-1;">Memuat produk...</div>`;

    let produk = await getProdukAll();
    let stok   = await getStokAll();
    stokCache  = stok;
    container.innerHTML = "";

    produk.forEach(item => {
        let stokAda  = stok[item.nama] || 0;
        let stokTeks = item.tipe === "berat"
            ? (stokAda>=1000 ? stokAda/1000+" Kg" : stokAda+" gram")
            : stokAda + " " + (item.satuan || "pcs");

        let hargaHtml = "";
        if(item.tipe === "berat"){
            hargaHtml = Object.entries({
                "1 ons":item.harga.ons,"1/4 kg":item.harga.perempat,
                "1/2 kg":item.harga.setengah,"1 kg":item.harga.kg
            }).filter(([k,v])=>v!==undefined)
              .map(([k,v])=>`<small>${k}: ${formatRp(v)}</small>`).join(" | ");
        } else {
            let label = item.tipe==="pak"
                ? `1 pak (${item.keterangan||""})` : `1 ${item.satuan||"pcs"}`;
            hargaHtml = `<small>${label}: ${formatRp(item.harga.satuan)}</small>`;
        }

        let safeId = item.nama.replace(/[^a-zA-Z0-9]/g,'');
        container.innerHTML += `
<div class="stok-card">
    <img src="${item.gambar||'https://placehold.co/300x200/f5f5f5/999?text=Produk'}"
         onerror="this.src='https://placehold.co/300x200/f5f5f5/999?text=Produk'"
         style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px">
    <h3>${item.nama}</h3>
    <p>Tipe: <b>${item.tipe}</b></p>
    <div style="margin-bottom:10px;font-size:13px;color:#555;">${hargaHtml}</div>
    <p>Stok: <b>${stokTeks}</b></p>

    <label style="font-size:12px;color:#888;">Nama Baru</label>
    <input type="text" id="editNama${safeId}" placeholder="Nama baru (opsional)">

    <label style="font-size:12px;color:#888;">Ganti Gambar</label>
    <input type="file" id="editGambar${safeId}" accept="image/*"
        onchange="previewEditGambar('${safeId}')">
    <img id="previewEdit${safeId}" style="display:none;width:100%;height:120px;
        object-fit:cover;border-radius:8px;margin:6px 0;">

    <label style="font-size:12px;color:#888;">Tambah / Kurangi Stok</label>
    <input type="number" id="inputStok${safeId}" placeholder="Jumlah">

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:5px">
        <button onclick="tambahStokCustom('${item.nama}')">➕ Tambah</button>
        <button onclick="kurangStokCustom('${item.nama}')" style="background:#e53935">➖ Kurangi</button>
    </div>
    <button onclick="editProduk('${item.nama}')" style="margin-top:8px;background:#1976d2">✏ Simpan Edit</button>
    <button onclick="hapusProduk('${item.nama}')" style="margin-top:5px;background:#e53935">🗑 Hapus</button>
</div>`;
    });
}

function previewEditGambar(safeId){
    let file = document.getElementById("editGambar"+safeId)?.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = e => {
        let prev = document.getElementById("previewEdit"+safeId);
        if(prev){ prev.src = e.target.result; prev.style.display = "block"; }
    };
    reader.readAsDataURL(file);
}

async function tambahStokCustom(nama){
    let safeId = nama.replace(/[^a-zA-Z0-9]/g,'');
    let jumlah = parseInt(document.getElementById("inputStok"+safeId)?.value);
    if(isNaN(jumlah)||jumlah<=0){ alert("Masukkan jumlah valid!"); return; }
    let stokBaru = (stokCache[nama]||0) + jumlah;
    await updateStok(nama, stokBaru);
    stokCache[nama] = stokBaru;
    alert("Stok berhasil ditambah!");
    loadAdminStok();
}

async function kurangStokCustom(nama){
    let safeId = nama.replace(/[^a-zA-Z0-9]/g,'');
    let jumlah = parseInt(document.getElementById("inputStok"+safeId)?.value);
    if(isNaN(jumlah)||jumlah<=0){ alert("Masukkan jumlah valid!"); return; }
    let stokBaru = Math.max(0, (stokCache[nama]||0) - jumlah);
    await updateStok(nama, stokBaru);
    stokCache[nama] = stokBaru;
    alert("Stok berhasil dikurangi!");
    loadAdminStok();
}

async function editProduk(nama){
    let safeId     = nama.replace(/[^a-zA-Z0-9]/g,'');
    let namaBaru   = document.getElementById("editNama"+safeId)?.value.trim();
    let gambarFile = document.getElementById("editGambar"+safeId)?.files[0];

    let update = {};
    if(namaBaru) update.nama = namaBaru;

    if(gambarFile){
        showLoading("Mengupload gambar...");
        try {
            let url = await uploadGambar(gambarFile);
            update.gambar = url;
        } catch(e) {
            hideLoading(); alert("Gagal upload gambar: " + e.message); return;
        }
        hideLoading();
    }

    if(Object.keys(update).length === 0){ alert("Tidak ada yang diubah."); return; }

    await db.from("produk").update(update).eq("nama", nama);

    if(namaBaru){
        let stokLama = stokCache[nama] || 0;
        await db.from("stok").update({nama_produk: namaBaru}).eq("nama_produk", nama);
        stokCache[namaBaru] = stokLama;
        delete stokCache[nama];
    }

    alert("Produk berhasil diperbarui!");
    loadAdminStok();
}

async function hapusProduk(nama){
    if(!confirm("Hapus produk "+nama+"?")) return;
    await db.from("produk").delete().eq("nama", nama);
    await db.from("stok").delete().eq("nama_produk", nama);
    delete stokCache[nama];
    alert("Produk dihapus!");
    loadAdminStok();
}

// =============================================
// ADMIN - TAMBAH PRODUK BARU
// =============================================

function toggleTipeProduk(){
    let tipe = document.getElementById("tipeProduk")?.value;
    let secBerat  = document.getElementById("secBerat");
    let secSatuan = document.getElementById("secSatuan");
    let secPak    = document.getElementById("secPak");
    if(secBerat)  secBerat.style.display  = tipe==="berat"  ? "block" : "none";
    if(secSatuan) secSatuan.style.display = tipe==="satuan" ? "block" : "none";
    if(secPak)    secPak.style.display    = tipe==="pak"    ? "block" : "none";
}

function previewGambar(){
    let file = document.getElementById("gambarProdukBaru")?.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = e => {
        let prev = document.getElementById("previewGambar");
        if(prev){ prev.src = e.target.result; prev.style.display = "block"; }
    };
    reader.readAsDataURL(file);
}

async function tambahProdukBaru(){
    let nama  = document.getElementById("namaProdukBaru")?.value.trim();
    let tipe  = document.getElementById("tipeProduk")?.value;
    let stok  = parseInt(document.getElementById("stokProdukBaru")?.value);
    let file  = document.getElementById("gambarProdukBaru")?.files[0];

    if(!nama){ alert("Nama produk wajib diisi!"); return; }
    if(isNaN(stok)||stok<0){ alert("Stok tidak valid!"); return; }

    let produk = await getProdukAll();
    if(produk.find(p=>p.nama.toLowerCase()===nama.toLowerCase())){
        alert("Nama produk sudah ada!"); return;
    }

    let hargaObj = {};
    let satuanStr = "", keteranganStr = "";

    if(tipe === "berat"){
        let ons      = parseInt(document.getElementById("hargaOns")?.value)||0;
        let perempat = parseInt(document.getElementById("hargaPerempat")?.value)||0;
        let setengah = parseInt(document.getElementById("hargaSetengah")?.value)||0;
        let kg       = parseInt(document.getElementById("hargaKg")?.value)||0;
        if(ons)      hargaObj.ons      = ons;
        if(perempat) hargaObj.perempat = perempat;
        if(setengah) hargaObj.setengah = setengah;
        if(kg)       hargaObj.kg       = kg;
        if(Object.keys(hargaObj).length===0){ alert("Isi minimal 1 harga!"); return; }
    } else if(tipe === "satuan"){
        let h = parseInt(document.getElementById("hargaSatuan")?.value)||0;
        if(!h){ alert("Isi harga satuan!"); return; }
        hargaObj.satuan = h;
        satuanStr = document.getElementById("namaJenisSatuan")?.value.trim() || "pcs";
    } else if(tipe === "pak"){
        let h = parseInt(document.getElementById("hargaPak")?.value)||0;
        if(!h){ alert("Isi harga pak!"); return; }
        hargaObj.satuan = h;
        keteranganStr = document.getElementById("keteranganPak")?.value.trim() || "";
    }

    let gambarUrl = "";
    if(file){
        showLoading("Mengupload gambar...");
        try { gambarUrl = await uploadGambar(file); }
        catch(e){ hideLoading(); alert("Gagal upload gambar: " + e.message); return; }
        hideLoading();
    }

    showLoading("Menyimpan produk...");
    let { error } = await db.from("produk").insert({
        nama, tipe, harga: hargaObj,
        gambar: gambarUrl,
        satuan: satuanStr || null,
        keterangan: keteranganStr || null
    });

    if(error){ hideLoading(); alert("Gagal: " + error.message); return; }
    await db.from("stok").insert({ nama_produk: nama, jumlah: stok });
    hideLoading();
    alert("Produk berhasil ditambahkan!");

    ["namaProdukBaru","stokProdukBaru","hargaOns","hargaPerempat","hargaSetengah",
     "hargaKg","hargaSatuan","namaJenisSatuan","hargaPak","keteranganPak"]
    .forEach(id => { let el=document.getElementById(id); if(el) el.value=""; });
    document.getElementById("gambarProdukBaru").value = "";
    let prev = document.getElementById("previewGambar");
    if(prev){ prev.src=""; prev.style.display="none"; }

    loadAdminStok();
}

// =============================================
// ADMIN - LOGIN / LOGOUT / AKUN
// =============================================

if(!localStorage.getItem("adminUser")) localStorage.setItem("adminUser","admin");
if(!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","admin123");

function loginAdmin(){
    let user = document.getElementById("adminUser")?.value;
    let pass = document.getElementById("adminPass")?.value;
    if(user===localStorage.getItem("adminUser") && pass===localStorage.getItem("adminPass")){
        localStorage.setItem("adminLogin","true");
        window.location.href = "admin.html";
    } else {
        alert("Username atau Password Salah!");
    }
}

function logoutAdmin(){
    localStorage.removeItem("adminLogin");
    window.location.href = "loginadmin.html";
}

function ubahAkunAdmin(){
    let user = document.getElementById("userBaru")?.value;
    let pass = document.getElementById("passBaru")?.value;
    if(!user||!pass){ alert("Isi username dan password!"); return; }
    localStorage.setItem("adminUser", user);
    localStorage.setItem("adminPass", pass);
    alert("Akun admin berhasil diubah!");
    document.getElementById("userBaru").value = "";
    document.getElementById("passBaru").value = "";
}

// =============================================
// STATISTIK & GRAFIK
// =============================================

async function loadStatistik(){
    let { data } = await db.from("pesanan").select("total");
    if(!data) return;
    let total = data.reduce((s,o)=>s+o.total, 0);
    let pesEl = document.getElementById("jumlahPesanan");
    let penEl = document.getElementById("totalPendapatan");
    if(pesEl) pesEl.innerText = data.length;
    if(penEl) penEl.innerText = formatRp(total);
}

async function hitungProdukTerlaris(){
    let { data } = await db.from("pesanan").select("items");
    if(!data) return;
    let produk = {};
    data.forEach(order => (order.items||[]).forEach(item => {
        produk[item.nama] = (produk[item.nama]||0) + 1;
    }));
    let terlaris = "-", jumlah = 0;
    Object.keys(produk).forEach(nama => {
        if(produk[nama]>jumlah){ jumlah=produk[nama]; terlaris=nama; }
    });
    let el = document.getElementById("produkTerlaris");
    if(el) el.innerText = terlaris;
}

async function buatGrafikPendapatan(){
    let canvas = document.getElementById("grafikPendapatan");
    if(!canvas) return;
    let { data } = await db.from("pesanan").select("order_id,total").order("id");
    if(!data||data.length===0) return;
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(o => o.order_id),
            datasets:[{ label:'Pendapatan (Rp)', data: data.map(o=>o.total),
                backgroundColor:'rgba(255,152,0,0.7)', borderColor:'#ff9800', borderWidth:1 }]
        },
        options:{ responsive:true }
    });
}

function cariProdukAdmin(){
    let keyword = document.getElementById("cariAdmin")?.value.toLowerCase();
    document.querySelectorAll("#adminStok .stok-card").forEach(card => {
        let nama = card.querySelector("h3").innerText.toLowerCase();
        card.style.display = nama.includes(keyword) ? "block" : "none";
    });
}

// =============================================
// LOAD ON PAGE READY
// =============================================

window.addEventListener("load", async function(){
    updateJumlahItem();
    loadKeranjang();
    await loadProdukTambahan();
    await loadRiwayat();
    await loadStatistik();
    await loadAdminStok();
    await loadAdminPesanan();
    await hitungProdukTerlaris();
    await buatGrafikPendapatan();
    toggleTipeProduk();
});
