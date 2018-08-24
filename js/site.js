function init(){
    var url = new URL(location.href);
    var name = url.searchParams.get("dash");
    loadConfig(name);
}

function loadConfig(name){
    $.ajax({
        url: "dash_data/"+name.toLowerCase()+".json",
        success: function(result){
            loadGrid(result);
        }
    }); 
}

function loadData(config){
    dataSets = [];
    config.charts.forEach(function(chart){
        var index = dataSets.indexOf(chart.data);
        if(index==-1){
            dataSets.push(chart.data);
            chart.data = dataSets.length-1;
        } else {
            chart.data = index;
        }
    });
    config.headlinefigurecharts.forEach(function(chart){
        var index = dataSets.indexOf(chart.data);
        if(index==-1){
            dataSets.push(chart.data);
            chart.data = dataSets.length-1;
        } else {
            chart.data = index;
        }
    });    
    var dataSetLoaded=0;
    dataSets.forEach(function(dataSet,i){
        $.ajax({
            url: "https://proxy.hxlstandard.org/data.json?url="+encodeURIComponent(dataSet),
            success: function(result){
                dataSets[i] = result;
                dataSetLoaded++;
                if(dataSets.length == dataSetLoaded){
                    createDashboard(dataSets,config);
                }
            }
        });                
    });
}

function loadGrid(config){
    $.ajax({
        url: "grid_data/"+config.grid+".html",
        success: function(result){
            $('#grid').html(result);
            loadData(config);
        }
    });    
}

function createDashboard(dataSets,config){
    $('.sp-circle').remove();
    var height = $(window).height()- 100
    $('.whole').height(height);
    $('.half').height(height/2);
    $('.quarter').height(height/4);

    $('#title').html('<h2>'+config.title+'</h2>');
    $('#description').html('<p>'+config.subtext+'</p>');

    if(config.headlinefigures>0){
        createHeadlineFigures(config.headlinefigures,config.headlinefigurecharts);
    }

    config.charts.forEach(function(chart,i){
        var bite = hxlBites.data(dataSets[chart.data]).reverse(chart.chartID);
        var id = '#chart' + i;
        if(bite.type=='chart'){
            createChart(id,bite);
        }
        if(bite.type=='crosstable'){
            createCrossTable(id,bite);
        }
        if(bite.type=='map'){
            createMap(id,bite);
        }
        if(bite.type =='text'){
            if(bite.subtype=='topline figure'){
                createHeadLineFigure(id,bite);
            }
        }        
    });
}

function createCrossTable(id,bite){
    $(id).html(bite.title);
    var html = hxlBites.render(id,bite);
}

function createHeadlineFigures(count,charts){
    charts.forEach(function(chart,i){
        var bite = hxlBites.data(dataSets[chart.data]).reverse(chart.chartID);
        var id="#headline"+i;
        $('#headline').append('<div id="'+id.slice(1)+'" class="col-md-4 headlinefigure"></div>');
        createHeadLineFigure(id,bite);
    });
}

function createHeadLineFigure(id,bite){
    var headlineHTML = '<div id="'+id.slice(1)+'text" class="headlinetext"></div><div id="'+id.slice(1)+'number" class="headlinenumber"></div>';
    $(id).html(headlineHTML);
    var text = bite.bite.split(':')[0];
    var number = bite.bite.split(':')[1].replace(/(<([^>]+)>)/ig,"").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    console.log(text);
    $(id+'text').html(text);
    $(id+'number').html(number);
}

function createChart(id,bite){
    var labels = [];
    var series = [];
    maxLength = 0;
    bite.bite.forEach(function(d,i){
        if(i>0){
            var label = d[0];
            if(label.length>maxLength){
                maxLength = label.length;
            }
            if(label.length>40){
                label = label.substring(0,35)+'...'
            }
            labels.push(label);
            series.push(d[1]);
        }  
    })
    var offset = 70;
    if(maxLength>30){
        offset = 120
    }
    $(id).html('<p class="bitetitle">'+bite.title+'</p>');

    if(bite.subtype=="row"){
        new Chartist.Bar(id, {
            labels: labels,
            series: [series]
        }, {
          seriesBarDistance: 10,
          reverseData: true,
          horizontalBars: true,
          axisY: {
            offset: offset
          },
          axisX: {
              labelInterpolationFnc: function(value, index) {
                var divide = 1;
                if(value>1000 && $(id).width()<500){
                    divide = 2
                }
                return index % divide === 0 ? value : null;
              }
          }
        });        
    } else {
        var data = {
          labels: labels,
          series: series
        };

        var options = {
          labelInterpolationFnc: function(value) {
            return value[6]
          }
        };

        var responsiveOptions = [
          ['screen and (min-width: 640px)', {
            chartPadding: 40,
            labelOffset: 80,
            labelDirection: 'explode',
            labelInterpolationFnc: function(value) {
              return value;
            }
          }],
          ['screen and (min-width: 1024px)', {
            labelOffset: 80,
            chartPadding: 40
          }]
        ];

        new Chartist.Pie(id, data, options, responsiveOptions);        
    }    
}

function createMap(id,bite){

    var bounds = [];

    id = id.substring(1);

    $('#'+id).html('<p class="bitetitle">'+bite.title+'</p><div id="'+id+'map" class="map"></div>');

    var map = L.map(id+'map', { fadeAnimation: false }).setView([0, 0], 2);

    var maxValue = bite.bite[1][1];
    var minValue = bite.bite[1][1];

    bite['lookup'] = {}

    bite.bite.forEach(function(d){
        if(d[1]>maxValue){
            maxValue = d[1];
        }
        if(d[1]<minValue){
            minValue = d[1];
        }
        bite.lookup[d[0]] = d[1];
    });

    L.tileLayer.grayscale('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 14, minZoom: 2
    }).addTo(map);

    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (id) {
        value = 0;
        bite.bite.forEach(function(d){
                    if(d[0]==id){
                        value=d[1];
                    }
                }); 
                               
        this._div.innerHTML = (id ?
            '<b>Value:</b> ' + value
            : 'Hover for value');
    };

    info.addTo(map);

    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = ['None', Number(minValue.toPrecision(3)), Number(((maxValue-minValue)/5+minValue).toPrecision(3)), Number(((maxValue-minValue)/5*2+minValue).toPrecision(3)), Number(((maxValue-minValue)/5*3+minValue).toPrecision(3)), Number(((maxValue-minValue)/5*4+minValue).toPrecision(3))],
            classes = ['mapcolornone','mapcolor0','mapcolor1','mapcolor2','mapcolor3','mapcolor4'];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i class="'+classes[i]+'"></i> ' +
                grades[i] + (grades[i + 1] ? i==0 ? '<br>' : ' &ndash; ' + grades[i + 1] + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);


    loadGeoms(bite.geom_url);

    function loadGeoms(urls){
        var total = urls.length;
        $('.info').html('Loading Geoms: '+total + ' to go');
        $.ajax({
            url: urls[0],
            dataType: 'json',
            success: function(result){
                var geom = {};
                if(result.type=='Topology'){
                  geom = topojson.feature(result,result.objects.geom);
                } else {
                  geom = result;
                }               
                var layer = L.geoJson(geom,
                    {
                        style: style,
                        onEachFeature: onEachFeature
                    }
                ).addTo(map);
                if(urls.length>1){
                    loadGeoms(urls.slice(1));
                } else {
                    $('.info').html('Hover for value');
                    fitBounds();
                }

            }
        });          

    }

    function fitBounds(){
        if(bounds.length>0){
            var fitBound = bounds[0];
            bounds.forEach(function(bound){
              if(fitBound._northEast.lat<bound._northEast.lat){
                fitBound._northEast.lat=bound._northEast.lat;
              }
              if(fitBound._northEast.lng<bound._northEast.lng){
                fitBound._northEast.lng=bound._northEast.lng;
              }
              if(fitBound._southWest.lng>bound._southWest.lng){
                fitBound._southWest.lng=bound._southWest.lng;
              }
              if(fitBound._southWest.lat>bound._southWest.lat){
                fitBound._southWest.lat=bound._southWest.lat;
              }                           
            });
            fitBound._northEast.lng=fitBound._northEast.lng+(fitBound._northEast.lng-fitBound._southWest.lng)*0.2;
            map.fitBounds(fitBound);
        }
    }

    function onEachFeature(feature, layer) {
        var featureCode = feature.properties[bite.geom_attribute];
        if(!isNaN(bite.lookup[featureCode])){
          bounds.push(layer.getBounds());
        }
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
        });
    }

    function style(feature) {
        return {
            className: getClass(feature.properties[bite.geom_attribute]),
            weight: 1,
            opacity: 1,
            color: '#cccccc',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }

    function highlightFeature(e) {
        info.update(e.target.feature.properties[bite.geom_attribute]);
    }

    function resetHighlight(e) {
        info.update();
    }    

    function getClass(id){
        var value = 0;
        var found = false;
        bite.bite.forEach(function(d){
            if(d[0]==id){
                value=d[1];
                found = true;
            }
        });
        if(found){
            return 'mapcolor'+Math.ceil((value-minValue)/(maxValue-minValue)*4);
        } else {
            return 'mapcolornone';
        }
    }        

}

init();