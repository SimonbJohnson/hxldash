function init(){
    var url = new URL(location.href);
    var name = url.searchParams.get("dash");
    loadConfig(name);
}

function loadConfig(name){
    console.log("Loading config");
    $.ajax({
        url: "dash_data/"+name.toLowerCase()+".json",
        success: function(result){
            console.log("Config Loaded");
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
    console.log("loading layout");
    $.ajax({
        url: "grid_data/"+config.grid+".html",
        success: function(result){
            $('#grid').html(result);
            loadData(config);
        }
    });    
}

function createDashboard(dataSets,config){
    var height = $(window).height()- 100
    $('.whole').height(height);
    $('.half').height(height/2);

    $('#title').html('<h2>'+config.title+'</h2>');
    $('#description').html('<p>'+config.subtext+'</p>');


    config.charts.forEach(function(chart,i){
        var bite = hxlBites.data(dataSets[chart.data]).reverse(chart.chartID);
        console.log(bite);
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
    });
}

function createCrossTable(id,bite){
    $(id).html(bite.title);
    var html = hxlBites.render(id,bite);
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
    $(id).html(bite.title);

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

    id = id.substring(1);

    var map = L.map(id, { fadeAnimation: false }).setView([0, 0], 2);

    var maxValue = bite.bite[1][1];
    var minValue = bite.bite[1][1];

    bite.bite.forEach(function(d){
        if(d[1]>maxValue){
            maxValue = d[1];
        }
        if(d[1]<minValue){
            minValue = d[1];
        }
    });

    L.tileLayer.grayscale('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 14, minZoom: 2
    }).addTo(map);

    $.ajax({
        url: bite.geom_url,
        success: function(result){
            var geom = topojson.feature(result,result.objects.geom);
            var layer = L.geoJson(geom, {style: style}).addTo(map);
            map.fitBounds(layer.getBounds());
        }
    });

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

    function getClass(id){
        var value = 0;
        bite.bite.forEach(function(d){
            if(d[0]==id){
                value=d[1];
            }
        });
        return 'mapcolor'+Math.ceil((value-minValue)/(maxValue-minValue)*4);
    }        

}

init();