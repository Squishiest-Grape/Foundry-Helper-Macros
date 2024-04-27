let socket;

Hooks.once("socketlib.ready", () => {
	socket = socketlib.registerModule("right_click_waypoint");
});