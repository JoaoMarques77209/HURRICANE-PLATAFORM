document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const anoSelecionado = params.get('ano');

    if (!anoSelecionado) {
        window.location.href = "selecionar_ano.html";
        return;
    }

    fetch("furacoes.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json();
        })
        .then(furacoes => {
            if (!Array.isArray(furacoes)) {
                throw new Error("Invalid JSON structure");
            }

            // Filtrar furacões do ano selecionado
            const filteredFuracoes = furacoes.filter(furacao => {
                const firstDate = furacao.data[0].data_hora;
                const year = parseInt(firstDate.substring(0, 4), 10);
                return year == anoSelecionado;
            });

            // Ordenar os furacões por data (mais recente primeiro)
            filteredFuracoes.sort((a, b) => {
                const dateA = new Date(a.data[0].data_hora.substring(0, 4), a.data[0].data_hora.substring(4, 6) - 1, a.data[0].data_hora.substring(6, 8));
                const dateB = new Date(b.data[0].data_hora.substring(0, 4), b.data[0].data_hora.substring(4, 6) - 1, b.data[0].data_hora.substring(6, 8));
                return dateB - dateA;
            });

            const container = document.getElementById("furacoes-container");
            filteredFuracoes.forEach(furacao => {
                if (!furacao.nome || !furacao.data || !Array.isArray(furacao.data) || furacao.data.length === 0) {
                    console.error("Invalid furacao data", furacao);
                    return;
                }

                const col = document.createElement("div");
                col.className = "col-md-6";

                const formatDate = dateStr => {
                    const year = dateStr.substring(0, 4);
                    const month = dateStr.substring(4, 6);
                    const day = dateStr.substring(6, 8);
                    return `${day}/${month}/${year}`;
                };

                const startDate = formatDate(furacao.data[0].data_hora);
                const endDate = formatDate(furacao.data[furacao.data.length - 1].data_hora);

                const card = `
                    <div class="row g-0 border rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative">
                        <div class="col p-4 d-flex flex-column position-static">
                            <h3 class="mb-0">${furacao.nome}</h3>
                            <h5 class="mb-3">${startDate} – ${endDate}</h5>
                            <button class="btn btn-primary" onclick='showDetails(${JSON.stringify(furacao)})'>Ver detalhes</button>
                        </div>
                    </div>
                `;
                col.innerHTML = card;
                container.appendChild(col);
            });
        })
        .catch(error => {
            console.error("Error fetching or parsing data:", error);
        });
});

function showDetails(furacao) {
    // Redirecionar para a página de detalhes com os dados do furacão na URL
    window.location.href = `detalhes.html?data=${encodeURIComponent(JSON.stringify(furacao))}`;
}
