const puppeteer = require("puppeteer")
//requiring pdfkit and fs modules
const pdf=require("pdfkit")
const fs=require("fs")


//the link which we are analyzing 
let targetLink='https://www.youtube.com/playlist?list=PLhy8TB5U6n17R78U7usaLQfCC8nbnG8Nc'
//declaring  variable to store current tab in browser
let curTab
async function yt() {
    try {
        //Opening Browser Using Puppeteer
        let openBrowser = puppeteer.launch({
            //to visible browser
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']

        })
        //await to wait until browser is open
        let waitForBrowser = await openBrowser

        //store all the tabs opened in browser in allTabsArr
        let allTabsArr=await waitForBrowser.pages()

        //selecting first tab and rediricting to target playlist
        curTab=allTabsArr[0]
        
        //redirircting to tagrgetLink page
        await curTab.goto(targetLink)
        console.log("Redirected");

        //waitig for heading selector to load
        await curTab.waitForSelector('h1#title')

        //store title of playlist name using evaluate
        
        //evaluate funtion(cb,selector)
        let nameOfPlayList=await curTab.evaluate(function(selector){ return document.querySelector(selector).innerText},'h1#title')
       // console.log(nameOfPlayList);

        //getting data Of play list
        let allData=await curTab.evaluate(getData,'#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer')
         console.log(nameOfPlayList,allData.noOfVideos,allData.noOfViews);
         //totale videos
         let totalVidoes=allData.noOfVideos.split(" ")[0];
         //to get curloaded videos on page
         let currentvideos=await curTab.evaluate(getLength,'.yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail')
         //to load all videos on playList
         while(totalVidoes-currentvideos>20)
         {  scrollToBottom()
            currentvideos=await curTab.evaluate(getLength,'.yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail')
         }
         console.log(currentvideos);


         //we call getStats funtion which will getStats of all videos in a list
         let videoStats=await getStats();
         

         //now we have to store the detalis in pdf
         let pdfDoc=new pdf
         pdfDoc.pipe(fs.createWriteStream(`${nameOfPlayList}.pdf`))
         pdfDoc.text(JSON.stringify(videoStats))
         pdfDoc.end()

    }
    catch (error){
       console.log(error);
    }
}
yt()

//funtion to get data of playlist
function getData(selector)
{
    let allElemements=document.querySelectorAll(selector)
    console.log("hii");
    let noOfVideos=allElemements[0].innerText
    let noOfViews=allElemements[1].innerText
    return {noOfVideos,noOfViews}
}

 //get length function    
function getLength(selector)
{   
   let cvideo=document.querySelectorAll(selector)
   return cvideo.length
}
async function scrollToBottom(){
    await curTab.evaluate(gotobottom)
    function gotobottom()
    {
        window.scrollBy(0,window.innerHeight)
    }
  
}
async function getStats()
{
    let list=curTab.evaluate(getNameAndDuration,'#video-title','#text.style-scope.ytd-thumbnail-overlay-time-status-renderer')
    return list;
}





//
function getNameAndDuration(videoSelector,durationSelector)
{
    let videoEl=document.querySelectorAll(videoSelector)
    let durartionEl=document.querySelectorAll(durationSelector)
    //store the details in arr
    let currentList=[]
    for(let i=0;i<durartionEl.length;i++)
    {
        let videoTitle=videoEl[i].innerText
        let duration=durartionEl[i].innerText
        currentList.push({videoTitle,duration})
    }
    return currentList;
}
     