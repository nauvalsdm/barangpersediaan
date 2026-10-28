import React from 'react';
import { X, Printer, CheckCircle, FileText, Download } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '../utils/formatters';

export const PrintDocumentModal: React.FC = () => {
  const { printDoc, setPrintDoc } = useInventory();

  if (!printDoc) return null;

  const { type, data } = printDoc;

  const handlePrint = () => {
    window.print();
  };

  const isMasuk = type === 'BUKTI_MASUK';
  const isKeluar = type === 'BUKTI_KELUAR';
  const isOpname = type === 'OPNAME_SHEET';
  const isRekap = type === 'REKAP_MUTASI';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop (hidden when printing) */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs no-print transition-opacity"
        onClick={() => setPrintDoc(null)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Floating Action Bar (no-print) */}
        <div className="no-print flex items-center justify-between p-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">
                Pratinjau Dokumen Cetak Resmi
              </h3>
              <p className="text-[11px] text-slate-400">
                Format standar dokumen persediaan kantor & gudang (A4)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              onClick={() => setPrintDoc(null)}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CONTENT BODY (A4 Page simulation) */}
        <div className="p-6 sm:p-10 bg-white text-black max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* Header Kop Surat */}
          <div className="border-b-2 border-black pb-4 mb-6 text-center">
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-600">
              KEMENTERIAN KEUANGAN REPUBLIK INDONESIA • DIREKTORAT JENDERAL PERBENDAHARAAN
            </p>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              KANTOR WILAYAH DJPb PROVINSI RIAU
            </h1>
            <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">
              BAGIAN UMUM • SUBBAGIAN TATA USAHA DAN RUMAH TANGGA (TURT)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Jl. Jenderal Sudirman No. 249, Pekanbaru, Riau 28282 • Telp: (0761) 23846 • djpb.kemenkeu.go.id/kanwil/riau
            </p>
          </div>

          {/* DOCUMENT BODY DEPENDING ON TYPE */}
          {isMasuk || isKeluar ? (
            <div className="space-y-6">
              {/* Document Title & Reference */}
              <div className="text-center">
                <h2 className="text-lg font-bold tracking-tight underline uppercase">
                  {isMasuk
                    ? 'BUKTI PENERIMAAN BARANG PERSEDIAAN'
                    : 'BUKTI PENGELUARAN / PERMINTAAN BARANG PERSEDIAAN'}
                </h2>
                <p className="text-xs font-mono font-bold mt-1 text-slate-700">
                  Nomor: {data.referenceNo}
                </p>
              </div>

              {/* Meta details grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-32 font-semibold">Tanggal Transaksi</span>
                    <span>: {formatDateIndo(data.date)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">
                      {isMasuk ? 'Pemasok / Sumber' : 'Unit Kerja / Pemohon'}
                    </span>
                    <span>: {data.sourceOrDestination}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-32 font-semibold">Petugas PIC</span>
                    <span>: {data.recipientOrSignee}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">Peruntukan / Catatan</span>
                    <span>: {data.notes || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Table of items */}
              <table className="w-full text-left text-xs border border-black border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-black border-b border-black">
                    <th className="py-2 px-3 border-r border-black text-center w-10">No</th>
                    <th className="py-2 px-3 border-r border-black">Kode Barang (SKU)</th>
                    <th className="py-2 px-3 border-r border-black">Nama Barang Persediaan</th>
                    <th className="py-2 px-3 border-r border-black text-center">Banyaknya</th>
                    <th className="py-2 px-3 border-r border-black text-right">Harga Satuan</th>
                    <th className="py-2 px-3 text-right">Jumlah Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="py-2.5 px-3 border-r border-black text-center">1</td>
                    <td className="py-2.5 px-3 border-r border-black font-mono font-bold">
                      {data.itemSku}
                    </td>
                    <td className="py-2.5 px-3 border-r border-black font-semibold">
                      {data.itemName}
                    </td>
                    <td className="py-2.5 px-3 border-r border-black text-center font-bold">
                      {data.quantity} {data.unit}
                    </td>
                    <td className="py-2.5 px-3 border-r border-black text-right">
                      {formatRupiah(data.unitPrice || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {formatRupiah(data.totalPrice || 0)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="font-bold border-t border-black bg-slate-50">
                    <td colSpan={5} className="py-2 px-3 text-right border-r border-black">
                      TOTAL NILAI MUTASI:
                    </td>
                    <td className="py-2 px-3 text-right font-black">
                      {formatRupiah(data.totalPrice || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures (3 Columns) */}
              <div className="pt-10 grid grid-cols-3 text-center text-xs gap-4 print-break-inside-avoid">
                <div>
                  <p className="font-medium text-slate-600">Diserahkan Oleh,</p>
                  <div className="h-16" />
                  <p className="font-bold border-t border-black pt-1 inline-block min-w-[140px]">
                    ( {isMasuk ? data.sourceOrDestination.split('(')[0].trim() : data.recipientOrSignee} )
                  </p>
                  <p className="text-[10px] text-slate-500">Pihak Pengirim/Penyedia</p>
                </div>

                <div>
                  <p className="font-medium text-slate-600">Diterima Oleh,</p>
                  <div className="h-16" />
                  <p className="font-bold border-t border-black pt-1 inline-block min-w-[140px]">
                    ( {isMasuk ? data.recipientOrSignee : data.sourceOrDestination.split('-')[0].trim()} )
                  </p>
                  <p className="text-[10px] text-slate-500">Penerima Barang</p>
                </div>

                <div>
                  <p className="font-medium text-slate-600">Mengetahui,</p>
                  <div className="h-16" />
                  <p className="font-bold border-t border-black pt-1 inline-block min-w-[140px]">
                    ( Ir. H. Hendra Wijaya, M.M. )
                  </p>
                  <p className="text-[10px] text-slate-500">Kepala Subbagian TURT Kanwil DJPb Riau</p>
                </div>
              </div>
            </div>
          ) : isOpname ? (
            /* STOCK OPNAME SHEET */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-bold tracking-tight underline uppercase">
                  BERITA ACARA PEMERIKSAAN FISIK (STOCK OPNAME)
                </h2>
                <p className="text-xs font-mono font-bold mt-1 text-slate-700">
                  {data.referenceNo || 'OPN-2026-FORM'}
                </p>
              </div>

              <div className="flex justify-between text-xs">
                <div>
                  <p><strong>Kegiatan:</strong> {data.title}</p>
                  <p><strong>Tanggal Cek:</strong> {formatDateIndo(data.date)}</p>
                </div>
                <div>
                  <p><strong>Petugas Pemeriksa:</strong> {data.officerName}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-black border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-black border-b border-black">
                    <th className="py-2 px-2 border-r border-black text-center w-8">No</th>
                    <th className="py-2 px-2 border-r border-black">SKU</th>
                    <th className="py-2 px-2 border-r border-black">Nama Barang</th>
                    <th className="py-2 px-2 border-r border-black text-center">Stok Buku</th>
                    <th className="py-2 px-2 border-r border-black text-center">Stok Fisik</th>
                    <th className="py-2 px-2 border-r border-black text-center">Selisih</th>
                    <th className="py-2 px-2">Keterangan / Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.entries || []).map((entry: any, idx: number) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="py-1.5 px-2 border-r border-black text-center">{idx + 1}</td>
                      <td className="py-1.5 px-2 border-r border-black font-mono font-bold">{entry.itemSku}</td>
                      <td className="py-1.5 px-2 border-r border-black">{entry.itemName}</td>
                      <td className="py-1.5 px-2 border-r border-black text-center font-bold">{entry.systemStock} {entry.unit}</td>
                      <td className="py-1.5 px-2 border-r border-black text-center font-bold">{entry.physicalStock} {entry.unit}</td>
                      <td className="py-1.5 px-2 border-r border-black text-center font-bold">
                        {entry.difference > 0 ? `+${entry.difference}` : entry.difference}
                      </td>
                      <td className="py-1.5 px-2">{entry.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-2 text-center text-xs gap-4 print-break-inside-avoid">
                <div>
                  <p className="font-medium text-slate-600">Petugas Pemeriksa Fisik,</p>
                  <div className="h-16" />
                  <p className="font-bold border-t border-black pt-1 inline-block min-w-[140px]">
                    ( {data.officerName} )
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-600">Penanggung Jawab Gudang,</p>
                  <div className="h-16" />
                  <p className="font-bold border-t border-black pt-1 inline-block min-w-[140px]">
                    ( Ir. H. Hendra Wijaya, M.M. )
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* REKAPITULASI MUTASI */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-bold tracking-tight underline uppercase">
                  LAPORAN REKAPITULASI & NILAI BARANG PERSEDIAAN
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Tanggal Cetak: {formatDateIndo(new Date().toISOString())}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs border border-black p-3 bg-slate-50">
                <div>
                  <span className="block text-slate-500">Total Jenis SKU:</span>
                  <span className="font-bold text-sm">{data.totalItems} Barang</span>
                </div>
                <div>
                  <span className="block text-slate-500">Total Unit Persediaan:</span>
                  <span className="font-bold text-sm">{data.totalStockQty} Unit</span>
                </div>
                <div>
                  <span className="block text-slate-500">Total Estimasi Nilai:</span>
                  <span className="font-bold text-sm text-emerald-800">{formatRupiah(data.totalAssetValue)}</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-black border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-black border-b border-black">
                    <th className="py-2 px-2 border-r border-black text-center w-8">No</th>
                    <th className="py-2 px-2 border-r border-black">Kategori</th>
                    <th className="py-2 px-2 border-r border-black text-center">Jumlah SKU</th>
                    <th className="py-2 px-2 border-r border-black text-center">Total Kuantitas</th>
                    <th className="py-2 px-2 text-right">Nilai Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.categoryReport || []).map((cat: any, idx: number) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="py-1.5 px-2 border-r border-black text-center">{idx + 1}</td>
                      <td className="py-1.5 px-2 border-r border-black font-semibold">{cat.category}</td>
                      <td className="py-1.5 px-2 border-r border-black text-center">{cat.count} barang</td>
                      <td className="py-1.5 px-2 border-r border-black text-center font-bold">{cat.totalQty} unit</td>
                      <td className="py-1.5 px-2 text-right font-bold">{formatRupiah(cat.totalVal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-2 text-center text-xs gap-4 print-break-inside-avoid">
                <div>
                  <p className="font-medium text-slate-600">Dibuat Oleh (Admin Persediaan),</p>
                  <div className="h-16" />
                  <p className="font-bold border-t border-black pt-1 inline-block min-w-[140px]">
                    ( Ahmad Fauzi )
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-600">Disetujui Oleh (Kepala Bagian),</p>
                  <div className="h-16" />
                  <p className="font-bold border-t border-black pt-1 inline-block min-w-[140px]">
                    ( Ir. H. Hendra Wijaya, M.M. )
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
