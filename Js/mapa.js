// Iconos de clima
    const weatherIcons = {
      0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
      45: "🌫️", 48: "🌫️",
      51: "🌦️", 53: "🌦️", 55: "🌦️",
      61: "🌧️", 63: "🌧️", 65: "🌧️",
      71: "🌨️", 73: "🌨️", 75: "🌨️",
      80: "🌧️", 81: "🌧️", 82: "🌧️",
      95: "⛈️", 96: "⛈️", 99: "⛈️"
    };

    // Conversión de temperaturas
    let unidadSeleccionada = "C";
    function convertirTemperatura(valorC, unidad) {
      switch (unidad) {
        case "K": return valorC + 273.15;
        case "F": return (valorC * 9) / 5 + 32;
        case "R": return (valorC + 273.15) * 9/5;
        case "Re": return valorC * 0.8;
        default: return valorC;
      }
    }
    function simboloUnidad(u) {
      return { C:"°C", K:"K", F:"°F", R:"°R", Re:"°Re" }[u] || "°C";
    }

    function abrirSettings() {
      document.getElementById("settingsModal").style.display = "flex";
    }
    function cerrarSettings() {
      document.getElementById("settingsModal").style.display = "none";
    }
    function cambiarUnidad() {
      unidadSeleccionada = document.getElementById("unidad").value;
    }

    // Crear mapa
    const map = L.map("map").setView([20, 0], 2);

    // Capa de tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      minZoom: 2,
      maxZoom: 8
    }).addTo(map);

    // Evento click
    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.current_weather) {
          L.popup()
            .setLatLng(e.latlng)
            .setContent("<div class='weather-popup'>⚠️ No hay datos climáticos</div>")
            .openOn(map);
          return;
        }

        const weather = data.current_weather;
        const icon = weatherIcons[weather.weathercode] || "❓";
        const temp = convertirTemperatura(weather.temperature, unidadSeleccionada).toFixed(1);
        const simbolo = simboloUnidad(unidadSeleccionada);

        const popupHtml = `
          <div class="weather-popup">
            <h4>📍 Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}</h4>
            <p>${icon} ${temp}${simbolo}</p>
            <p>💨 Viento: ${weather.windspeed} km/h</p>
            <p>🕒 Hora: ${weather.time.replace("T", " ")}</p>
          </div>
        `;
        L.popup()
          .setLatLng(e.latlng)
          .setContent(popupHtml)
          .openOn(map);
      } catch (err) {
        console.error(err);
        L.popup()
          .setLatLng(e.latlng)
          .setContent("<div class='weather-popup'>⚠️ Error al obtener datos</div>")
          .openOn(map);
      }
    });