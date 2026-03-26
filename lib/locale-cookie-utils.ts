// Ovo je helper koji možeš koristiti u bilo kojoj client komponenti za postavljanje locale cookie-ja i brisanje viška cookie-ja

export function setLocaleCookie(locale) {
  document.cookie = `locale=${locale}; path=/; max-age=31536000`;
}

export function deleteExtraLocaleCookies() {
  // Briše lang i .locale cookie-je
  document.cookie = 'lang=; Max-Age=0; path=/';
  document.cookie = '.locale=; Max-Age=0; path=/';
}

// Primjer upotrebe u useEffect:
// useEffect(() => {
//   setLocaleCookie('en') // ili 'sr'
//   deleteExtraLocaleCookies()
// }, [])
