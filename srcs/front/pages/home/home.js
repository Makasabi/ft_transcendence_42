export async function footer()
{
	return await fetch("/front/pages/home/footer.html").then(response => response.text());
}

export async function header_in()
{
	return await fetch("/front/pages/home/header.html").then(response => response.text());
}

export async function home()
{
	return await fetch("/front/pages/home/home.html").then(response => response.text());

}
