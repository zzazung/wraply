export function formatDate(timestamp:number):string{

  const date = new Date(timestamp);

  const y = date.getFullYear();

  const m = String(date.getMonth()+1).padStart(2,"0");

  const d = String(date.getDate()).padStart(2,"0");

  const h = String(date.getHours()).padStart(2,"0");

  const min = String(date.getMinutes()).padStart(2,"0");

  return `${y}-${m}-${d} ${h}:${min}`;

}

export function formatRelativeTime(timestamp:number):string{

  const now = Date.now();

  const diff = Math.floor((now - timestamp) / 1000);

  if(diff < 60){

    return `${diff}초 전`;

  }

  if(diff < 3600){

    const m = Math.floor(diff / 60);

    return `${m}분 전`;

  }

  if(diff < 86400){

    const h = Math.floor(diff / 3600);

    return `${h}시간 전`;

  }

  const d = Math.floor(diff / 86400);

  return `${d}일 전`;

}

export function formatFileSize(bytes:number){

  const mb = bytes / 1024 / 1024;

  return `${mb.toFixed(1)} MB`;

}