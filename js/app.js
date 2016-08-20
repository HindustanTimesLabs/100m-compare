require("../css/styles.scss");
d3 = require("d3")
$ = jQuery = require("jQuery")
_ = require("underscore")

// scroll check to hide stepper

$(window).scroll(function() {
    var windscroll = $(window).scrollTop();
    var chartpos = ($('.chart').position().top)+50
    if ($('.stepper-container').hasClass('active')){
        if (chartpos>windscroll){
            d3.select('.stepper-container')
                .transition()
                .style('opacity',0)
                .duration(50)
        } else {
            d3.select('.stepper-container')
                .transition()
                .style('opacity',1)
                .duration(50)
        }
    }
}).scroll();

var box = {
            height: $(window).height()*2.2,
            width: $(window).width(),  
            sidemargin: 50, 
            topmargin: 50
        }

// this animates our lovely scroll
var scrollAnimator = function(fastspeed){
    $("html, body").animate(
        { scrollTop: ($('.dummydiv').position().top -   ($(window).height()*0.97))}
        , 100/fastspeed * 750, 'swing'
    );
};

var starttime, currenttime

var barwidth = 2, arrowlength = 40

box.effectiveheight = box.height-(box.topmargin*3)

var svg = d3.select(".chart")
    .append("svg")
    .attr("class","chart-svg")
    .attr('height', (box.height))
    .attr('width',(box.width-box.sidemargin))

$('.category').on('click',function(){
    $('.category').addClass('inactive')
    $('.category').removeClass('active')
    $(this).removeClass('inactive')
    $(this).addClass('active')
    $('.category-section').attr('data-active',$(this).attr('data-which'))
})

$('#replay').on('click',function(){
    $('.stepper-container.active').removeClass('active')
    
    d3.select('.stepper-container')
        .style('opacity',0)
        .style('z-index',-10)

    $("html, body").animate(
        { scrollTop: ($('.select-ins.cat').position().top)}
        , 1000, 'swing'
    );
    

})

d3.csv("data/data.csv",function(error,men){

    // country list! In alphabetical order
    var countryList = _.chain(men).pluck('Country').uniq().value().sort()

    // Continents are best when they are colorful!
    var colorList = ["#334D5C","#DF5A49","#EFC94C","#45b29D","#2980B9","#E37A3f","#FDEEA7"]

    //  append data to dropdown 
    countryList.forEach(function(e){
        $('.country-dropdown').append('<option value = "'+e+'">'+e+'</option>')
    })

    $('.country1').val('India')
    $('.country2').val('Jamaica')

    // randomizer
    $('.button.random').on('click',function(){
        $('.country1').val(countryList[getRandomCountry()])
        $('.country2').val(countryList[getRandomCountry()])
    })

    function getRandomCountry(){
        return _.random(0, (countryList.length-1));
    }

    // We begin the chart here peoplezzzzz
    var chart = svg.append('g')
        .attr("class","chart-container")
        .attr("transform","translate(" + box.sidemargin + "," + (box.topmargin) + ")")

    // define scale bands
    var x = d3.scaleBand()
                .domain([0,1])
                .range([0,(box.width-(box.sidemargin*2))])
                .padding(0.7)
                .paddingOuter(1)

    // y scales!
    var y = d3.scaleLinear()
        .range([(box.height-(box.topmargin*3.5)), 0])
        .domain([100,0]);

    var xAxis = d3.axisTop()
        .scale(x)

    var yAxis = d3.axisLeft()
        .scale(y)
        .ticks('10')
        .tickFormat(function(d) { 
            if (d == 0){ 
                return "Start"
            } else if (d==10 || d==100){
                return d+"m"
            } else {
                return d
            } 
        })
        .tickSize(-box.width, 0, 0)

    chart.append("g")
        .attr("transform","translate(0,0)")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("dy", ".71")

    chart.append('line')
        .attr("class","finish-line axis")
        .attr("x1", 0)     // x position of the first end of the line
        .attr("y1", y(100))      // y position of the first end of the line
        .attr("x2", box.width)     // x position of the second end of the line
        .attr("y2", y(100))
        .style("stroke-width","5px")

    chart.append('text')
        .attr("class","finish-line-text")
        .text("Finish Line")
        .attr("transform","translate("+((box.width/2)-100)+","+(box.height-box.topmargin-80)+")")

    var mintime, maxtime
    $('.button.play').on('click',function(){
        chart.selectAll(".bar,.country-name").remove()
            $('.stepper-container.active').removeClass('active')
    
    d3.select('.stepper-container')
        .style('opacity',0)
        .style('z-index',-10)

        // build a data for our thing
        var selected = _.shuffle([_.findWhere(men,{Country: $('.country1').val(),Gender: $('.category-section').attr('data-active')}),_.findWhere(men,{Country: $('.country2').val(),Gender: $('.category-section').attr('data-active')})])
        // calculate min time.
        mintime= d3.min(selected, function(e){return parseFloat(e.cleantime)})
        maxtime= d3.max(selected, function(e){return parseFloat(e.cleantime)})
        // calculate fast speed.
        var fastspeed = d3.max(selected, function(e){return parseFloat(e.speed)})

        selected.forEach(function(e){
            e.pos_at_max_dist = mintime*e.speed
            e.Year = parseInt(e.Year)
        })

        gettext(_.findWhere(selected,{'cleantime':maxtime.toString()}) , _.findWhere(selected,{'cleantime':mintime.toString()}))

        chart.selectAll(".bar")
            .data(selected)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", function(d,i) { return x (i); })
            .attr("width", x.bandwidth())
            .attr("y", function(d) { return 0; })
            .attr("height",0)
            .style("fill",function(e){return colorList[_.random(0,(colorList.length-1))]})

        // STOPWATCH YAY
        var stopWatchTimer = function(){
                    currenttime = Date.now()
                    if (currenttime-starttime < mintime *1000){
                        d3.select('.time')
                            .text(getcleantime(currenttime - starttime)+"s")
                    } else {
                        clearInterval(stopWatchTimer)
                    }
                }

            $('.stopwatch').removeClass('inactive')
            starttime = Date.now()
            setTimeout(scrollAnimator(fastspeed), 1000);
            var timer = setInterval(stopWatchTimer, 0.5);

            d3.selectAll('.bar')
                .transition()
                .attr("height", function(d) { return y(d['pos_at_max_dist']); })
                .duration(function(e){return e['pos_at_max_dist']/e['speed'] * 1000 })

            d3.select('.stepper-container')
                .style('z-index',10)
                .transition()
                .delay((mintime*1000)+1700)
                .attr('class','stepper-container active')
                .style('opacity',1)
                .duration(2000)

            chart.selectAll('.country-name')
                .data(selected)
                .enter()
                .append('text')
                .attr('class','country-name')
                .text(function(e){return e.Country})
                .attr('transform',function(e,i){
                    if (i==0)
                            {
                                var text = d3.select(this).text()
                                if (text.match(/ /)){
                                    var fw = text.split(/ /)[0]
                                } else {
                                    var fw = text
                                }
                                return 'translate('+ (x(i) - (fw.length*10.5))+",-40)"
                            }
                        else{
                            return 'translate('+(x(i)+x.bandwidth()+10)+",-40)"
                        }
                        })
                .attr('x',function(e,i){
                    var text = d3.select(this).text()
                                if (text.match(/' '/)){
                                    var fw = text.split(' ')[0]
                                } else {
                                    var fw = text
                                }
                    if (i==0){
                        return x(i) - (fw.length*10.5)
                    }else{
                        return x(i) + x.bandwidth() + 7
                    }
                })
                .attr('y',function(e,i){
                    if (i==0){
                        return y(e.pos_at_max_dist)-40
                    }else{
                        return y(e.pos_at_max_dist)-40}
                })
                .attr('dy',0.71)
                .call(wrap, 40)
                .style('opacity',0)

            d3.selectAll('.country-name')
                .transition()
                .delay((mintime*1000)+1000)
                .style('opacity',1)
                .duration(1000)

            // code for round function

            function round(value, precision) {
                var multiplier = Math.pow(10, precision || 0);
                return Math.round(value * multiplier) / multiplier;
            }

            // code for stopwatch
           var stopwatch = d3.select('.stopwatch')

            // code to clean time

            function getcleantime(time){
                var milliseconds = ((time % 1000)/10).toFixed(0)
                var seconds = parseInt(time/1000)
                if (seconds<1){
                    seconds = '00'
                } else if (seconds<10){
                    seconds = '0'+seconds
                }
                if (milliseconds<1){
                    milliseconds = '00'
                } else if (milliseconds<10){
                    milliseconds = '0'+milliseconds
                } else if (milliseconds ==100){
                    milliseconds = '00';
                    seconds = (parseInt(seconds)+1)
                }
                return seconds + "." + milliseconds 
            }

            function gettext(slow,fast){
                var head = fast.Country+" wins!"
                var result 
                var diff = round(parseFloat(slow.cleantime) - parseFloat(fast.cleantime),2)
                var dist = round((100-slow.pos_at_max_dist),2)
                // tie
                if (diff == 0){
                    head = "That's a tie!"
                    result = "It happens even in this sport that's won by split seconds."
                }

                // hundredth of a second
                else if (diff == "0.01"){
                    head = "That looks like a tie. But it's not."
                    result = fast.Country+ " beat "+slow.Country+" by one hundredth of a second. That is literally a hair's breadth and it counts."
                } 
                // time stuff starts - less than 0.1s - that was close
                else if (diff<0.1){ 
                    head = "That was close!"
                    result = "The difference between the winner and loser: "+diff+" seconds."
                }
                // time - more than 10m diff - 
                else if (dist >= 10){
                    head = "Whoa! That was quite a margin."
                    result = "When "+fast.Country+checkapostophe(fast.Country)+fast.Athlete+" hits the finish line, " + slow.Country + checkapostophe(slow.Country) + slow.Athlete +" is "+dist+" metres behind. The difference is "+diff+" seconds."
                }
                else if (fast.Country=='United States' && fast.Gender=="F"){
                    result = slow.Country+" is "+diff+" seconds behind. In "+slow.Country+checkapostophe(slow.Country)+"defense, United States' Florence Griffith Joyner is the fastest woman ever. Her world record from 1988 hasn't been broken yet."
                }

                else if (fast.Country == "Jamaica" && fast.Gender=="M"){
                    result = "What did you expect? That's Jamaica's Usain Bolt &mdash; the fastest human ever. "+slow.Country+" is "+diff+" seconds slower than him."
                }
                // old record beating new record
                else if (fast.Year < 2000 && slow.Year > 2000){
                    result = 'Even though '+ fast.Country + checkapostophe(fast.Country)+"national record was last broken in "+fast.Year+", it is "+ diff +" seconds ahead of "+slow.Country+"'s "+slow.Year+" record."
                }  
                // new record
                else if (slow.Year>=2015 && fast.Year<2015){
                    result = "Even though "+slow.Country+checkapostophe(slow.Country)+"national record was broken as recently as "+slow.Year+", "+fast.Country+checkapostophe(fast.Country)+fast.Year+" record is still good enough to beat them by "+diff+" seconds."
                } 

                else if (slow.Country=='India'){
                        head = "Ouch!"
                        result = "At "+slow.cleantime+" seconds, "+slow.Country+" finished "+diff+" seconds slower than "+fast.Country+"."
                    } 

                else if (fast.Country=="India"){
                    head = "Yay!"
                    options = [('When '+fast.Country+checkapostophe(fast.Country)+fast.Athlete+" hits the finish line, "+slow.Country+checkapostophe(slow.Country)+slow.Athlete +" is "+dist+" metres behind. The difference is "+diff+" seconds."),
                        (fast.Country+" beat "+slow.Country+" by "+diff+" seconds."),
                        ("When "+fast.Country+" wins, "+slow.Country+" is "+diff +" seconds behind."),
                        fast.Country+" wins by "+diff+" seconds."
                    ]
                        result = options[_.random((options.length-1))];
                    }
                    
                else {

                    if (slow.Year<=1990 && fast.Year>=1990){
                        result = 'When '+fast.Country+checkapostophe(fast.Country)+fast.Athlete+" crosses the finish line, "+slow.Country+checkapostophe(slow.Country)+slow.Athlete +" is "+dist+" metres behind. The difference is of "+diff+" seconds. Fun fact: "+slow.Country+checkapostophe(slow.Country)+"record hasn't been broken since "+slow.Year+"."
                    }   else {
                        options = [
                    ('When '+fast.Country+checkapostophe(fast.Country)+fast.Athlete+" hits the finish line, "+slow.Country+checkapostophe(slow.Country)+slow.Athlete +" is "+dist+" metres behind. The difference is "+diff+" seconds."),
                        (fast.Country+" beat "+slow.Country+" by "+diff+" seconds."),
                        ("When "+fast.Country+" wins, "+slow.Country+" is "+diff +" seconds behind.")
                    ]
                     result = options[_.random((options.length-1))];

                    }
                    
                }
                    
                setTimeout(function(){$('.stepper-container .maintext').html(result)},450)

                d3.select('.stepper-container .result-head')
                .text(head)
                .transition()
                .delay(100)
                .style('opacity',1)
                .duration(300)
                var gender, tweet

                if (slow.Gender=="M"){
                    gender =  'men'
                }else{
                    gender = 'women'
                }

                if (diff == 0){
                    tweet = "If the fastest "+gender + " from "+slow.Country + " and "+fast.Country+" raced each other, it'll be a tie."
                } else {
                    tweet = "If the fastest "+gender + " from "+slow.Country + " and "+fast.Country+" raced each other, "+ fast.Country +" would win."
                }

                
                var url = 'http://www.hindustantimes.com/static/olympics/race-two-countries-100m'
                $('.twlink').attr('href',"http://twitter.com/intent/tweet?url="+url+"&text="+tweet)
            }
            
            function checkapostophe(e){
                if (e.match(/s$/g)){
                    return "' "
                } else{
                    return "'s "
                }
            }

            function wrap(text, width) {
              text.each(function() {

                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");


                while (word = words.pop()) {
                  line.push(word);
                  tspan.text(line.join(" "));
                  if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                  }
                }
              });
            }
             // code for round function
            function round(value, precision) {
                var multiplier = Math.pow(10, precision || 0);
                return Math.round(value * multiplier) / multiplier;
            }
        })
    
})
