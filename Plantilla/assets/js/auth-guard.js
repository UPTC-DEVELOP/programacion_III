(function () {
	const TOKEN_KEY = "olimac_panther_token";
	const USER_KEY = "olimac_panther_user";
	const ROLE_KEY = "olimac_panther_role";

	const token = sessionStorage.getItem(TOKEN_KEY);
	if (!token) {
		window.location.replace("login.html");
		return;
	}

	document.addEventListener("DOMContentLoaded", function () {
		const formLocal = document.getElementById("formSesionPanther");
		if (formLocal) {
			formLocal.hidden = true;
		}
	});
})();
