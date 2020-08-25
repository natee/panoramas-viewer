
export function getMarker(){
  const json = localStorage.getItem("__psv_labels");
  if(json !== null){
    return JSON.parse(json)
  }
  return []
}

export function saveMarker(labels: any[]){
  localStorage.setItem("__psv_labels", JSON.stringify(labels))
}

export function removeMarker(){
  localStorage.removeItem("__psv_labels")
}