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

    if('headlinefigurecharts' in config){
        config.headlinefigurecharts.forEach(function(chart){
            var index = dataSets.indexOf(chart.data);
            if(index==-1){
                dataSets.push(chart.data);
                chart.data = dataSets.length-1;
            } else {
                chart.data = index;
            }
        });
    }  

    var dataSetLoaded=0;
    dataSets.forEach(function(dataSet,i){
        $.ajax({
            url: "https://proxy.hxlstandard.org/data.json?url="+encodeURIComponent(dataSet),
            success: function(result){
                dataSets[i] = result;
                dataSetLoaded++;
                if(dataSets.length == dataSetLoaded){
                    createDashboard(dataSets,dataSets,config);
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

function createDashboard(dataSets,filterDataSets,config){
    $('.sp-circle').remove();
    var height = $(window).height()- 100
    $('.whole').height(height);
    $('.half').height(height/2-15);
    $('.quarter').height(height/4);
    $('.third').height(height/3);
    $('.twothird').height(height/3*2);

    $('#title').html('<h2>'+config.title+'</h2>');
    $('#description').html('<p>'+config.subtext+'</p>');
    if('headlinefigures' in config && config.headlinefigures>0){
        createHeadlineFigures(config.headlinefigures,config.headlinefigurecharts,filterDataSets);
    }
    if(dataSets==filterDataSets){
        if('filters' in config && config.filtersOn){
            createFilterBar(dataSets,config.filters,config);
        }
    }


    config.charts.forEach(function(chart,i){
        if(typeof chart.chartID === 'string'){
            chart.chartID = [chart.chartID];
        }
        var id = '#chart' + i;
        if(filterDataSets[chart.data].length==0){
            $(id).html('<p>No Data</p>');
        } else {
            var bites = [];

            chart.chartID.forEach(function(id){
                bites.push(hxlBites.data(filterDataSets[chart.data]).reverse(id));
            });
            if(bites[0].type=='chart'){
                if(chart.sort==undefined){
                    chart.sort = 'unsorted';
                }
                createChart(id,bites,chart.sort);
            }
            if(bites[0].type=='crosstable'){
                createCrossTable(id,bites[0]);
            }
            if(bites[0].type=='map'){
                if(chart.scale==undefined){
                    chart.scale = 'linear';
                }
                createMap(id,bites[0],chart.scale);
            }
        }        
    });
}

function createFilterBar(dataSets,filters,config){
    filters.forEach(function(filter,i){
        $('#filter').append('<div id="filter'+i+'" class="col-sm-4 filter"></div>');
        $('#filter'+i).html('<div class="dropdown"><p class="filtertext">Filter for '+filter.text+':</p><p class="filterdrop"><select id="dropdown'+i+'"><option>No selection</option></select></div>');
    });
    createDropDowns(dataSets,filters,config);
}


function createDropDowns(dataSets,filters,config){
    var dropdowns = [];
    filters.forEach(function(filter,i){
        var values = []
        dataSets.forEach(function(dataset){
            hxl.wrap(dataset).getValues(filter.tag).forEach(function(v){
                values.push(v);
            })
            
        });
        var unique = values.filter(function(v,i,self){
            return self.indexOf(v) === i;
        }).sort(function(a,b){
            if(a > b){
                return 1;
            } else if (b > a){
                return -1;
            } else {
                return 0;
            }
        });
        unique.forEach(function(value){
            var label = value;
            if(label.length>25){
                label = label.substr(0,22)+'...';
            }
            $('#dropdown'+i).append('<option value="'+value+'"">'+label+'</option>');
        });
        $('#dropdown'+i).on('change',function(){
            var listFilters = filters.map(function(d,i){
                return {'tag':d.tag,'value':$('#dropdown'+i).val()}
            });
            filterDataSets(dataSets,listFilters,config);
        });
    });

}

function filterDataSets(dataSets,filters,config){
    var filteredDataSets = [];
    var hxlFilter = [];
    filters.forEach(function(v,i){
        if(v.value!='No selection'){
            hxlFilter.push({pattern: v.tag, test: v.value});
            //hxlFilter.push(v.tag+'='+v.value);
        }
    });
    if(hxlFilter.length==0){
        createDashboard(dataSets,dataSets,config);
    } else {
        
        dataSets.forEach(function(dataSet,i){
            filteredDataSets[i]=[];
            hxlData = hxl.wrap(dataSet);
            hxlFilter.forEach(function(f,i){
                hxlData = hxlData.withRows(f)
            })
            hxlData.forEach(function(row,col,rowindex){
                if(rowindex==0){
                    filteredDataSets[i].push([]);
                    filteredDataSets[i].push([]);
                    row.columns.forEach(function(c,j){
                        filteredDataSets[i][0].push(c.header);
                        filteredDataSets[i][1].push(c.displayTag);
                    });
                }
                filteredDataSets[i].push([]);
                row.values.forEach(function(v,j){
                    filteredDataSets[i][rowindex+2].push(v);

                });
            });
            createDashboard(dataSets,filteredDataSets,config);
        });
    }
}

function createCrossTable(id,bite){
    $(id).html('<p class="bitetitle">'+bite.title+'</p>');
    var html = hxlBites.render(id,bite);
}

function createHeadlineFigures(count,charts,dataSets){
    charts.forEach(function(chart,i){
        var id="#headline"+i;
        if(dataSets[chart.data].length==0){
            $(id).html('No Data');
        } else {
            var bite = hxlBites.data(dataSets[chart.data]).reverse(chart.chartID);
            $('#headline').append('<div id="'+id.slice(1)+'" class="col-md-4 headlinefigure"></div>');
            createHeadLineFigure(id,bite);
        }
    });
}

function createHeadLineFigure(id,bite){
    var headlineHTML = '<div id="'+id.slice(1)+'text" class="headlinetext"></div><div id="'+id.slice(1)+'number" class="headlinenumber"></div>';
    $(id).html(headlineHTML);
    var text = bite.bite.split(':')[0];
    var number = String(parseInt(bite.bite.split(':')[1].replace(/[^0-9\.]/g, ''))).replace(/(<([^>]+)>)/ig,"").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    $(id+'text').html(text);
    $(id+'number').html(number);
}

function createChart(id,bite,sort){

    var labels = [];
    var series = [];
    var subtype = bite[0].subtype;
    maxLength = 0;
    if(sort=='descending'){
        var topline = bite[0].bite.shift();
        bite[0].bite.sort(function(a, b){
            return b[1]-a[1];
        });
        bite[0].bite.unshift(topline);
    }
    var offset = 70;
    if(maxLength>30){
        offset = 120
    }
    var variables = [];
    bite.forEach(function(b){
        variables.push(b.title.split(' by ')[0]);
    });
    var title = '';
    if(variables.length>1){
        variables.forEach(function(v,i){
            if(i==0){
                title = v
            } else {
                title +=', '+v;
            }
        });
        title += ' by ' + bite[0].title.split(' by ')[1];
    } else {
        title = bite[0].title;
    }
    $(id).addClass('chartcontainer');
    $(id).html('<div class="titlecontainer"><p class="bitetitle">'+title+'</p></div><div id="chartcontainer'+id.substring(1)+'" class="chartelement"></div>');
    id = id.substring(1);
    $('#chartcontainer'+id).height($('#'+id).height()-55);
    if(subtype=="row"){
        bite[0].bite.forEach(function(d,i){
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
        });
        new Chartist.Bar('#chartcontainer'+id, {
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
                var divide = 0.5;
                if(value>1000 && $(id).width()<500){
                    divide = 1
                }
                if(value>999999){
                    value = value / 1000000 + 'm';
                }
                return index % divide === 0 ? value : null;
              }
          }
        });        
    } else if (subtype=="pie") {

        bite[0].bite.forEach(function(d,i){
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
        });

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

        new Chartist.Pie('#chartcontainer'+id, data, options, responsiveOptions);        
    } else {
        
        var dataSetsLines = [];
        bite.forEach(function(d,j){
            var data = d.bite.map(function(d,i){
                if(i>0){
                    return {'x':d[0].getTime(),'y':d[1]}
                }
            }).splice(1);
            dataSetsLines.push({name:variables[j],data:data});            
        });

        new Chartist.Line('#chartcontainer'+id, {
            series: dataSetsLines
        }, {
          lineSmooth: Chartist.Interpolation.cardinal({
            tension: 0
          }),
          height: ($('#chartcontainer'+id).height() - 20) + 'px',
          showPoint: false,
          axisY: {
            type: Chartist.AutoScaleAxis,
            showLabel: true,
            showGrid: true,
            low: 0,
            ticks: [1, 10, 20, 30]
          },
          axisX: {
            type: Chartist.AutoScaleAxis,
            showLabel: true,
            showGrid: true,
            labelInterpolationFnc: function skipLabels(value, index) {
                return index % 2  === 0 ? new Date(value).toISOString().slice(0,10) : null;
            }
          },
          plugins: [
            Chartist.plugins.legend()
            ]
        });        
    }   
}

function createMap(id,bite,scale){
    var bounds = [];

    id = id.substring(1);

    $('#'+id).html('<p class="bitetitle">'+bite.title+'</p><div id="'+id+'map" class="map"></div>');

    var map = L.map(id+'map', { fadeAnimation: false }).setView([0, 0], 2);

    var maxValue = bite.bite[1][1];
    var minValue = bite.bite[1][1]-1;

    bite['lookup'] = {}

    bite.bite.forEach(function(d){
        if(d[1]>maxValue){
            maxValue = d[1];
        }
        if(d[1]-1<minValue){
            minValue = d[1]-1;
        }
        bite.lookup[d[0]] = d[1];
    });

    L.tileLayer.grayscale('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 14, minZoom: 1
    }).addTo(map);

    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info infohover'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (id) {
        value = 'No Data';
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

        var div = L.DomUtil.create('div', 'info legend')
        var grades = ['No Data', Number(minValue.toPrecision(3)), Number(((maxValue-minValue)/4+minValue).toPrecision(3)), Number(((maxValue-minValue)/4*2+minValue).toPrecision(3)), Number(((maxValue-minValue)/4*3+minValue).toPrecision(3)), Number(((maxValue-minValue)/4*4+minValue).toPrecision(3))]
        if(scale=='log'){
            grades.forEach(function(g,i){
                if(i>0){
                    grades[i] = Number((Math.exp(((i-1)/4)*Math.log(maxValue - minValue))+minValue).toPrecision(3));
                }
            });
        }
        var classes = ['mapcolornone','mapcolor0','mapcolor1','mapcolor2','mapcolor3','mapcolor4'];

        for (var i = 0; i < grades.length; i++) {
            div.innerHTML += '<i class="'+classes[i]+'"></i> ';
            div.innerHTML += isNaN(Number(grades[i])) ? grades[i] : Math.ceil(grades[i]);
            div.innerHTML += (grades[i + 1] ? i==0 ? '<br>' : ' &ndash; ' + Math.floor(grades[i + 1]) + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);


    loadGeoms(bite.geom_url);

    function loadGeoms(urls){
        var total = urls.length;
        $('.infohover').html('Loading Geoms: '+total + ' to go');
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
                    $('.infohover').html('Hover for value');
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
            if(scale=='log'){
                var maxDivide = Math.log(maxValue-minValue)
                if(maxDivide ==0){return 'mapcolor'+4}
                return 'mapcolor'+Math.floor(Math.log(value-minValue)/Math.log(maxValue-minValue)*4);
            } else {
                return 'mapcolor'+Math.floor((value-minValue)/(maxValue-minValue)*4);
            }
        } else {
            return 'mapcolornone';
        }
    }        

}

init();