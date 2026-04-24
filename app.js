
let pointA = {
    lat: null,
    lng: null
};

let pointB = {
    lat: null,
    lng: null
};


var markerDest, routeLayer
let timeout, marker

let latitude
navigator.geolocation.getCurrentPosition(function(position){
    // Point de l'utilisateur
    pointA.lat = position.coords.latitude
    pointA.lng = position.coords.longitude
    affichageMap(pointA.lat, pointA.lng)
})

// Champ pré rempli


function affichageMap(lat, lng){
    document.querySelector('.distance').style.display = 'none'
    recupNomVille(pointA.lat ,pointA.lng, true)
    // document.querySelector('#rech2').value = "Valeur"

    var map = L.map('map', {
        zoomDelta: 0.25,
        zoomSnap: 0
    }).setView([lat, lng], 16)

    // Tuiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map)

    // Clique utilisateur
    function onMapClick(e){
        let lat1 = e.latlng.lat
        let lng1 = e.latlng.lng
        recupNomVille(lat1, lng1, false)
    }
    map.on('click', onMapClick)

    // marker de départ
    function markerDepart(lat, lng){
        
        console.log("Passage dans le fonction de marker de départ");
        if(marker){
            map.removeLayer(marker)
        }
        marker = L.marker([lat, lng]).addTo(map)
        marker.bindPopup('Départ').openPopup()
        
    }

    markerDepart(lat, lng)
    

    // API Nominatim
    async function recupNomVille(lat1,lng1, depart){
        const url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat='+ lat1 +'&lon='+ lng1
        const requete = await fetch(url, {method: 'GET'})
        if(requete.ok){
            let data = await requete.json()
            // console.log(data.address.state);
            // console.log(data.name);
            console.log(data.display_name);
            // console.log(data.address.suburb);
            if(!depart){
                if(data.address.state === 'Analamanga'){
                    creerMarker(lat1, lng1, data.display_name)
                }else{
                    alert('Ce ville n\'est pas disponible')
                }
            }else{
                document.querySelector('#rech2').value = data.display_name
            }
            
            
        }else{
            console.log("Une problème a survenu");
        }
    }


    var greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    })

    function creerMarker(lat1, lng1, nom_ville){
        if(markerDest){
            map.removeLayer(markerDest)
        }
        markerDest = L.marker([lat1, lng1], {icon: greenIcon}).addTo(map)
        document.querySelector('#rech').value = nom_ville
        markerDest.bindPopup(nom_ville).openPopup()
        // console.log(lat, lng, lat1, lng1);
        ajusterVue(pointA.lat, pointA.lng, lat1, lng1)
        trajet(pointA.lat, pointA.lng, lat1, lng1)
        var points = [[lat, lng], [lat1, lng1]]
    }

    function ajusterVue(lat1, lng1, lat2, lng2){
        const bounds = [
            [lat1, lng1],
            [lat2, lng2]
        ]

        map.fitBounds(bounds, {
            padding: [100, 200], 
            animation: true,
            duration: 1.5,
            easeLinearity: 0.25
        })
    }

    async function trajet(lat, lng, lat1, lng1){
        document.querySelector('#fond').style.visibility = 'visible'
        const osrm = 'https://router.project-osrm.org/route/v1/driving/'+ lng +',' + lat + ';' + lng1 + ',' + lat1 + '?overview=full&geometries=geojson'
        const requ_os = await fetch(osrm, {method: 'GET'})
        if(requ_os.ok){
            let data = await requ_os.json()

            document.querySelector('#fond').style.visibility = 'hidden'

            // Afficher distance en kilomètres
            let di = ((data.routes[0].distance)/1000).toFixed(3)
            if(di > 100){
                alert('Trop loin (pas disponible)')
                return
            }

            document.querySelector('.distance').style.display = 'block'
            document.querySelector('.distance').textContent = di  + ' KM (en routes)'


            

            let geom = data.routes[0].geometry.coordinates
            let latlngs = geom.map(p => [p[1], p[0]])

            

            if(routeLayer){
                map.removeLayer(routeLayer)
            }

            routeLayer = L.polyline(latlngs, {color: 'blue'}).addTo(map)

            // document.querySelector('#rech').value = 

        }
    }


    document.querySelector('#rech2').addEventListener('input', function(e){
        console.log("Changement de départ");
        const clearRech = document.querySelector('#resu_rech')
        if(clearRech === null){
            console.log("Le résultat n'existe pas");
        }else{
            clearRech.innerHTML = '';
        }
    
        let ville = e.target.value
    
        clearTimeout(timeout)
    
        timeout = setTimeout(()=> {
            if(ville.length >= 3){
                rechercheVille(ville, '#loader1')
            }
        }, 300)
    })

    
    const rech = document.querySelector("#rech")
    rech.addEventListener('input', function(e){

        const clearRech = document.querySelector('#resu_rech')
        if(clearRech === null){
            console.log("Le résultat n'existe pas");
        }else{
            clearRech.innerHTML = '';
        }

        let ville = e.target.value

        clearTimeout(timeout)

        timeout = setTimeout(()=> {
            if(ville.length >= 3){
                rechercheVille(ville, '#loader')
            }
        }, 300)

    })

    // API Photon (recherche)
    async function rechercheVille(ville, load) {

        // DEP_DEST 1 '#loader' ==> load
        const loader = document.querySelector(load)
        console.log(loader);
        loader.style.display = 'block'

        // DEP_DEST 2 : #resu_rech dispo pour les 2
        if (ville.length < 3) {
            const resu_rech = document.querySelector('#resu_rech')
            if(resu_rech) resu_rech.innerHTML = ''
        };

        // Bounding box pour Analamanga (Min Long, Min Lat, Max Long, Max Lat)
        const bbox = "46.6,-19.5,48.5,-17.5";
        
        // URL Photon : beaucoup plus tolérante sur les mots incomplets (ex: "ambat")
        const url_photon = `https://photon.komoot.io/api/?q=${encodeURIComponent(ville)}&bbox=${bbox}&limit=10`;

        try {
            const requete = await fetch(url_photon);
            if (requete.ok) {
                const data = await requete.json();
                
                // Photon renvoie un objet GeoJSON (data.features)
                // console.clear();


                // NETTOYAGE D'INTERFACE
                // On récupère le conteneur et on le vide complètement
                // // DEP_DEST 3 : resu_rech : dispo pour les 2
                const resuRech = document.querySelector('#resu_rech');
                if (resuRech) {
                    resuRech.innerHTML = ''; 
                }

                if (data.features.length === 0) {
                    afficherAucunResultat();
                    loader.style.display = 'none';
                    return;
                }

                let i = 1
                data.features.forEach(feature => {
                    console.log(i);
                    // Le nom est dans properties
                    const nom = feature.properties.name || "";
                    const villeNom = feature.properties.city || "";
                    const complet = `${nom} ${villeNom}`.trim();

                    // Les coordonnées sont dans geometry.coordinates [lng, lat]
                    const lng1 = feature.geometry.coordinates[0];
                    const lat1 = feature.geometry.coordinates[1];

                    console.log(`Suggestion : ${complet} (Lat: ${lat1}, Lng: ${lng1})`);
                    
                    
                    creation_liste(i, complet, lat1, lng1, load)

                    i++
                });
                loader.style.display = 'none'
            }
            
        } catch (error) {
            console.error("Erreur avec Photon :", error);
        }
    }

    async function creation_liste(i, diffVil, lat1, lng1, load) {
        let resuRech = document.querySelector('#resu_rech');
        
        // Si le conteneur n'existe pas encore dans le HTML, on le crée une seule fois
        if (!resuRech) {
            // // DEP_DEST  5 : .recherche
            if(load === '#loader'){
                const recherche = document.querySelector('.recherche');
                resuRech = document.createElement('div');
                resuRech.id = "resu_rech";
                recherche.appendChild(resuRech);
            }else{
                const recherche2 = document.querySelector('.recherche2')
                resuRech = document.createElement('div');
                resuRech.id = "resu_rech";
                recherche2.appendChild(resuRech);
            }
            
        }


        
        // Si c'est le premier résultat, on initialise l'UL
        if (i === 1) {
            resuRech.innerHTML = '<ul class="list-group mon_ul"></ul>';
        }

        const ul = resuRech.querySelector('.mon_ul');

        // Création de l'élément de liste
        const li = document.createElement('li');
        li.classList.add('list-group-item');


        
        
        const a = document.createElement('a');
        a.classList.add('text-decoration-none', 'link-dark', 'd-block')
        a.href = "#";
        let dis = parseFloat(await calculDistance(pointA.lat, pointA.lng, lat1, lng1))
        

        if(dis > 30){
            return
        }

        
        if(load === '#loader'){
            a.textContent = diffVil + ' ( ' + dis + ' km)';
        }else{
            a.textContent = diffVil
        }
        
        
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if(load === '#loader'){
                creerMarker(lat1, lng1, diffVil); // On place le marker
                document.querySelector('#rech').value = diffVil
                resuRech.remove()
            }else{
                map.eachLayer(function(layer){
                    map.removeLayer(layer);
                });

                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19
                }).addTo(map);

                document.querySelector('#rech').value = ""
                document.querySelector('.distance').style.display = 'none'

                pointA.lat = lat1
                pointA.lng = lng1
                markerDepart(pointA.lat, pointA.lng)
                document.querySelector('#rech2').value = diffVil
                resuRech.remove()
            }
        });

        li.appendChild(a);
        ul.appendChild(li);
    }


    


    function afficherAucunResultat() {
        let resuRech = document.querySelector('#resu_rech');

        if (!resuRech) {
            const recherche = document.querySelector('.recherche');
            resuRech = document.createElement('div');
            resuRech.id = "resu_rech";
            recherche.appendChild(resuRech);
        }

        resuRech.innerHTML = `
            <div class="list-group-item text-muted">
                Aucun résultat trouvé
            </div>
        `;
    }
}

function calculDistance(lat1, lon1, lat2, lon2){
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
}

// Simulation chauffeur
