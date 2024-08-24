document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const furacaoData = params.get('data');

    console.log("URL parameters:", params.toString());
    console.log("Decoded hurricane data:", furacaoData);

    if (furacaoData) {
        const furacao = JSON.parse(decodeURIComponent(furacaoData));
        console.log("Parsed hurricane data:", furacao);

        document.getElementById('furacao-nome').textContent = furacao.nome;

        const formatDate = dateStr => {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            return `${day}/${month}/${year}`;
        };

        const categoryMapping = {
            'TD': 'Depressão Tropical',
            'TS': 'Tempestade Tropical',
            'HU': 'Furacão',
            'EX': 'Ciclone Extratropical',
            'SD': 'Depressão Subtropical'
        };

        const getHurricaneCategory = (windSpeedKmH) => {
            if (windSpeedKmH >= 252) return 'Furacão Categoria 5';
            if (windSpeedKmH >= 209) return 'Furacão Categoria 4';
            if (windSpeedKmH >= 178) return 'Furacão Categoria 3';
            if (windSpeedKmH >= 154) return 'Furacão Categoria 2';
            if (windSpeedKmH >= 119) return 'Furacão Categoria 1';
            return null;
        };

        const getCategoryColor = (windSpeedKmH) => {
            if (windSpeedKmH >= 252) return '#8B008B'; // Categoria Cinco - Purple
            if (windSpeedKmH >= 209) return '#FF4500'; // Categoria Quatro - Orange Red
            if (windSpeedKmH >= 178) return '#FF6347'; // Categoria Três - Tomato
            if (windSpeedKmH >= 154) return '#FFA500'; // Categoria Dois - Orange
            if (windSpeedKmH >= 119) return '#FFD700'; // Categoria Um - Gold
            if (windSpeedKmH >= 63)  return '#00CED1'; // Tempestade Tropical - Dark Turquoise
            return '#1E90FF'; // Depressão Tropical - Dodger Blue
        };

        const startDate = formatDate(furacao.data[0].data_hora);
        const endDate = formatDate(furacao.data[furacao.data.length - 1].data_hora);

        document.getElementById('furacao-periodo').textContent = `${startDate} – ${endDate}`;

        var map = L.map('map').setView([25.0, -60.0], 5);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }).addTo(map);

        var hurricanePath = furacao.coordenadas.map(coords => [
            parseFloat(coords[0]),
            -parseFloat(coords[1])
        ]);

        // Create polyline for the hurricane path
        var polyline = L.polyline(hurricanePath, { color: 'red' }).addTo(map);
        map.fitBounds(polyline.getBounds());

        furacao.data.forEach(function(point, index) {
            const latitude = parseFloat(point.latitude.replace('N', '').replace('S', '-'));
            const longitude = -parseFloat(point.longitude.replace('W', '').replace('E', ''));
            
            // Convert speed from knots to km/h
            const windSpeedKmH = (parseFloat(point.vento) * 1.852).toFixed(2);
            
            // Determine the category description
            let categoryDescription = categoryMapping[point.tipo] || point.tipo;
            if (point.tipo === 'HU') {
                const hurricaneCategory = getHurricaneCategory(windSpeedKmH);
                if (hurricaneCategory) {
                    categoryDescription = hurricaneCategory;
                }
            }
            
            // Get the color for the circle based on the wind speed
            const circleColor = getCategoryColor(windSpeedKmH);
            
            // Format date
            const date = formatDate(point.data_hora);
            
            const circle = L.circleMarker([latitude, longitude], {
                radius: 5,
                color: circleColor,
                fillColor: circleColor,
                fillOpacity: 1
            }).addTo(map);

            const popupContent = '<strong>Velocidade do Vento:</strong> ' + windSpeedKmH + ' km/h' +
                                 '<br><strong>Categoria:</strong> ' + categoryDescription +
                                 '<br><strong>Pressão:</strong> ' + point.pressao +
                                 '<br><strong>Data:</strong> ' + date;

            circle.on('mouseover', function(e) {
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent(popupContent)
                    .openOn(map);
            });

            // Add row to the table
            const tableRow = document.createElement('tr');
            tableRow.innerHTML = `
                <td>${date}</td>
                <td>${windSpeedKmH}</td>
                <td>${categoryDescription}</td>
                <td>${point.pressao}</td>
            `;
            document.querySelector('#hurricane-table tbody').appendChild(tableRow);
        });

        // Add Saffir-Simpson scale legend
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'info legend');
            const categories = [119, 154, 178, 209, 252];
            const labels = [
                'Categoria 1 (119-153 km/h)',
                'Categoria 2 (154-177 km/h)',
                'Categoria 3 (178-208 km/h)',
                'Categoria 4 (209-251 km/h)',
                'Categoria 5 (252+ km/h)'
            ];
            const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#8B008B'];

            div.innerHTML += '<strong>Escala Saffir-Simpson</strong><br>';

            for (let i = 0; i < categories.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + colors[i] + '; width: 18px; height: 18px; display: inline-block; margin-right: 5px;"></i> ' +
                    labels[i] + '<br>';
            }

            return div;
        };

        legend.addTo(map);

    } else {
        console.error("No hurricane data found in URL parameters");
    }
});
