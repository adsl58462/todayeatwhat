    const categoryInput = document.getElementById("category");
    const distanceInput = document.getElementById("distance");
    const distanceValue = document.getElementById("distanceValue");
    const ratingFilter = document.getElementById("ratingFilter");
    const resultDiv = document.getElementById("result");
    const detailDiv = document.getElementById("details");
    const wheel = document.getElementById("wheel");
    

    
    
    let map;
    let service;
    let currentLocation;
    let currentPlaces = [];
    let placeMarkers = [];
    let highlightMarker = null;
    let totalRotate = 0;


    distanceInput.addEventListener("input", () => {
    distanceValue.textContent = distanceInput.value;
    });

    categoryInput.addEventListener("change", findPlaces);
    ratingFilter.addEventListener("change", findPlaces);
    distanceInput.addEventListener("change", findPlaces);
    function initMap() {
      navigator.geolocation.getCurrentPosition(pos => {
        currentLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        map = new google.maps.Map(document.getElementById("map"), {
          center: currentLocation,
          zoom: 15
        });
        new google.maps.Marker({ position: currentLocation, map, title: "你的位置" });
      });
    }

    function clearMarkers() {
      placeMarkers.forEach(marker => marker.setMap(null));
      placeMarkers = [];
      if (highlightMarker) highlightMarker.setMap(null);
    }

    function findPlaces() {
      if (!currentLocation) return alert("無法獲取定位");
      clearMarkers();

      const keyword = categoryInput.value;
      const radius = parseInt(distanceInput.value) * 1000;
      const minRating = parseFloat(ratingFilter.value);

      const request = {
        location: currentLocation,
        radius: radius,
        keyword: keyword,
        openNow: true
      };

      service = new google.maps.places.PlacesService(map);
      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          currentPlaces = results
            .filter(p => !minRating || (p.rating && p.rating >= minRating))
            .map(p => ({
              name: p.name,
              rating: p.rating || "無星等",
              address: p.vicinity || "地址不詳",
              location: p.geometry.location,
              place_id: p.place_id
            }));

          if (currentPlaces.length === 0) return alert("沒有符合條件的店家");
          showMarkers(currentPlaces);
          updateWheel();
        } else {
          alert("搜尋失敗！");
        }
      });
    }

    function showMarkers(places) {
      map.setCenter(currentLocation);
      places.forEach(place => {
        const marker = new google.maps.Marker({
          position: place.location,
          map,
          title: place.name
        });
        placeMarkers.push(marker);
      });
    }

    function updateWheel() {
      const colors = ['#fbc2eb', '#a6c1ee', '#fdcbf1', '#f3e5f5'];
      const num = currentPlaces.length;
      const slice = 100 / num;
      const gradientParts = currentPlaces.map((_, i) =>
        `${colors[i % colors.length]} ${i * slice}% ${(i + 1) * slice}%`
      );
      wheel.style.background = `conic-gradient(${gradientParts.join(",")})`;
    }

    function spin() {
      if (currentPlaces.length === 0) return alert("請先搜尋餐廳");
      const anglePer = 360 / currentPlaces.length;
      const index = Math.floor(Math.random() * currentPlaces.length);
      const rotateDeg = 360 * 10 + (360 - index * anglePer - anglePer / 2); // 每次多轉10圈
      totalRotate += rotateDeg;
      wheel.style.transform = `rotate(${totalRotate}deg)`;

    

 

      setTimeout(() => {
        const selected = currentPlaces[index];
        resultDiv.textContent = `🎯 選擇：${selected.name}`;
        detailDiv.innerHTML = `
          <p>⭐ 星等：${selected.rating}</p>
          <p>📍 地址：${selected.address}</p>
          <button onclick="openGoogleMapsReview('${selected.place_id}')">查看評論</button>
        `;

        if (highlightMarker) highlightMarker.setMap(null);
        highlightMarker = new google.maps.Marker({
          position: selected.location,
          map,
          title: selected.name,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });
        map.panTo(selected.location);
      }, 5200);
    }
    function openGoogleMapsReview(placeId) {
      const url = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
      window.open(url, "_blank");
      }
