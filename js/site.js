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
    });
}

function createCrossTable(id,bite){
    $(id).html(bite.title);
    var html = hxlBites.render(id,bite);
}

function createChart(id,bite){
    var labels = [];
    var series = [];
    bite.bite.forEach(function(d,i){
        if(i>0){
            labels.push(d[0]);
            series.push(d[1]);
        }
        
    })
    $(id).html(bite.title);
    console.log(bite);
    if(bite.subtype=="row"){
        new Chartist.Bar(id, {
            labels: labels,
            series: [series]
        }, {
          seriesBarDistance: 10,
          reverseData: true,
          horizontalBars: true,
          axisY: {
            offset: 70
          }
        });        
    } else {
        var data = {
          labels: labels,
          series: series
        };

        var options = {
          labelInterpolationFnc: function(value) {
            return value[0]
          }
        };

        var responsiveOptions = [
          ['screen and (min-width: 640px)', {
            chartPadding: 30,
            labelOffset: 100,
            labelDirection: 'explode',
            labelInterpolationFnc: function(value) {
              return value;
            }
          }],
          ['screen and (min-width: 1024px)', {
            labelOffset: 80,
            chartPadding: 20
          }]
        ];

        new Chartist.Pie(id, data, options, responsiveOptions);        
    }
    
}

init();