 // Splash auto ocultar
    window.addEventListener("load", () => {
      setTimeout(() => {
        document.getElementById("splash").style.display = "none";
      }, 3000);
    });

    // === Configuración de unidades ===
    let unidadSeleccionada = "C"; 
    const simboloUnidad = { C:"°C", K:"K", F:"°F", R:"°R", Re:"°Re" };

    function convertirTemperatura(valorC, unidad) {
      switch (unidad) {
        case "K": return valorC + 273.15;
        case "F": return (valorC * 9) / 5 + 32;
        case "R": return (valorC + 273.15) * 9/5;
        case "Re": return valorC * 0.8;
        default: return valorC;
      }
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

    // === Iconos clima ===
    const weatherIcons = {
      0:"☀️",1:"🌤️",2:"⛅",3:"☁️",
      45:"🌫️",48:"🌫️",
      51:"🌦️",53:"🌦️",55:"🌦️",
      61:"🌧️",63:"🌧️",65:"🌧️",
      71:"🌨️",73:"🌨️",75:"🌨️",
      80:"🌧️",81:"🌧️",82:"🌧️",
      95:"⛈️",96:"⛈️",99:"⛈️"
    };

    // Buscar con Enter
    document.getElementById('city').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('searchBtn').click();
      }
    });

    async function getWeather() {
      const city = document.getElementById("city").value.trim();
      if (!city) return alert("Escribe una ciudad");

      const currentBox = document.getElementById("current");
      currentBox.innerHTML = `<div><h2>Buscando...</h2><p>Por favor espera</p></div>`;

      try {
        // Geocoding
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          currentBox.innerHTML = "<p>❌ Ciudad no encontrada</p>";
          return;
        }
        const { latitude, longitude, name, country } = geoData.results[0];

        // Weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        if (!weatherData.current_weather) {
          currentBox.innerHTML = "<p>⚠️ No hay datos de clima</p>";
          return;
        }

        const current = weatherData.current_weather;
        const currentIcon = weatherIcons[current.weathercode] || "❓";
        const tempActual = convertirTemperatura(current.temperature, unidadSeleccionada);

        // Clima actual
        currentBox.innerHTML = `
          <div>
            <h2>${name}, ${country}</h2>
            <h1>${tempActual.toFixed(1)} ${simboloUnidad[unidadSeleccionada]}</h1>
            <p>Viento: ${current.windspeed} km/h</p>
            <p>Hora local: ${current.time.replace("T"," ")}</p>
          </div>
          <div style="font-size:3rem;">${currentIcon}</div>
        `;

        // === HOY ===
        const hoursContainer = document.getElementById("forecast-hours");
        hoursContainer.innerHTML = "";
        const hourlyTimes = weatherData.hourly.time || [];
        const hourlyTemps = weatherData.hourly.temperature_2m || [];
        const hourlyCodes = weatherData.hourly.weathercode || [];
        const currentDate = (current.time || "").split("T")[0];
        const dayIndices = [];
        for (let i=0;i<hourlyTimes.length;i++) {
          if (hourlyTimes[i].split("T")[0] === currentDate) dayIndices.push(i);
        }
        if (dayIndices.length===0) {
          for (let i=0;i<Math.min(24,hourlyTimes.length);i++) dayIndices.push(i);
        }
        dayIndices.forEach(idx=>{
          const timePart = hourlyTimes[idx].split("T")[1]?.slice(0,5);
          const temp = convertirTemperatura(hourlyTemps[idx], unidadSeleccionada);
          const icon = weatherIcons[hourlyCodes[idx]] || "❓";
          const card = document.createElement("div");
          card.className="hour-card";
          card.innerHTML = `<h4>${timePart}</h4><div style="font-size:1.2rem">${icon}</div><p>${temp.toFixed(1)} ${simboloUnidad[unidadSeleccionada]}</p>`;
          hoursContainer.appendChild(card);
        });

        // Scroll
        const leftBtn=document.getElementById("scroll-left");
        const rightBtn=document.getElementById("scroll-right");
        if (dayIndices.length<=3){leftBtn.style.display="none";rightBtn.style.display="none";}
        else {leftBtn.style.display="";rightBtn.style.display="";}
        leftBtn.onclick=()=>hoursContainer.scrollBy({left:-200,behavior:"smooth"});
        rightBtn.onclick=()=>hoursContainer.scrollBy({left:200,behavior:"smooth"});
        hoursContainer.onwheel=e=>{
          if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){
            e.preventDefault();
            hoursContainer.scrollLeft+=e.deltaY;
          }
        };

        // === 7 días ===
        const daysContainer=document.getElementById("forecast-days");
        daysContainer.innerHTML="";
        (weatherData.daily.time || []).forEach((date,i)=>{
          const day=new Date(date).toLocaleDateString("es-ES",{weekday:'short'});
          const max=convertirTemperatura(weatherData.daily.temperature_2m_max[i], unidadSeleccionada);
          const min=convertirTemperatura(weatherData.daily.temperature_2m_min[i], unidadSeleccionada);
          const icon=weatherIcons[weatherData.daily.weathercode[i]]||"❓";
          const dayCard=document.createElement("div");
          dayCard.className="day-card";
          dayCard.innerHTML=`<h4>${day}</h4><div style="font-size:1.3rem">${icon}</div><p>${max.toFixed(1)} / ${min.toFixed(1)} ${simboloUnidad[unidadSeleccionada]}</p>`;
          daysContainer.appendChild(dayCard);
        });

      } catch (err) {
        console.error(err);
        currentBox.innerHTML="<p>⚠️ Error al obtener datos</p>";
      }
    }