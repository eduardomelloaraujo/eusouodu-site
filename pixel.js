// Pixel da Meta: PageView em toda página que carrega este arquivo; a compra do relatório é marcada em /mapa/obrigado.html
(() => {
  const PIXEL_ID = ""; // preencher com o ID do conjunto de dados do Events Manager
  if (!PIXEL_ID) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq("init", PIXEL_ID);
  fbq("track", "PageView");

  const PRECO = { 7: 37, 30: 97 };
  const caminho = location.pathname.replace(/index\.html$/, "");
  if (caminho === "/mapa/") {
    fbq("track", "ViewContent", { content_ids: ["mapa"], content_type: "product", currency: "BRL", value: 37 });
    addEventListener("DOMContentLoaded", () => document.getElementById("form")?.addEventListener("submit", () => {
      const plano = document.querySelector("input[name=plano]:checked")?.value;
      fbq("track", "InitiateCheckout", { content_ids: ["mapa-" + plano], currency: "BRL", value: PRECO[plano] || 37 });
    }));
  }
  if (caminho === "/mapa/obrigado.html") {
    const q = new URLSearchParams(location.search);
    const pagamento = q.get("payment_id") || q.get("collection_id");
    if (q.get("pendente") || q.get("collection_status") === "pending" || !pagamento) return;
    // o formulário guarda o plano antes de ir para o Mercado Pago; este arquivo roda antes do script da página apagar
    let plano = (q.get("external_reference") || "").split("-")[1];
    try { plano = plano || JSON.parse(sessionStorage.getItem("mapa-form") || "{}").plano; } catch (e) {}
    try { if (localStorage.getItem("compra-" + pagamento)) return; localStorage.setItem("compra-" + pagamento, "1"); } catch (e) {}
    fbq("track", "Purchase", { content_ids: ["mapa-" + plano], currency: "BRL", value: PRECO[plano] || 37 }, { eventID: "mapa-" + pagamento });
  }
})();
