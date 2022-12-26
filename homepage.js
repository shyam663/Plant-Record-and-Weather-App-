getWeatherData();

async function getWeatherData(){
  let url = `https://api.openweathermp.org/data/2.5/weather?lat=36.684402&on=-121.802170&appd=8ec6ae8e7d3e1fa43c6d70e1f562e0a&units=imperial`;

  let response = await fetch(url);
  let data = await response.json();
  console.log(data);

  if(data.main.temp >= 50){
  document.querySelector("#temperatur").innerHTML = `<i class="bi bi-brightness-high"></i>`;
} else{
  document.querySelector("#temperatur").innerHTML = `<i class="bi bi-snow"></i>`;
}

document.querySelector("#temperature").innerHTML +=`<p>Todays Weather: City: ${data.name} Temp: ${data.main.temp} with ${data.weather[0].description}</p>`;

document.querySelector("#localDes").innerHTML += `${data.name}:`;
}