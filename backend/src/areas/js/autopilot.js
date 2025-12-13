(function () {
	function sampleRoute() {
		return {
			origin: 'origin',
			destination: 'destination',
			waypoints: [
				"waypoints array here"
			],
			plannedAt: new Date().toISOString()
		};
	}

	function sendEngage(route) {
		if (window.autopilot && typeof window.autopilot.sendRoute === 'function') {
			window.autopilot.sendRoute({ action: 'engage', route });
			console.log('Sent engage route to main', route);
		} else {
			console.warn('autopilot API not available in preload');
		}
	}

	function sendDisengage() {
		if (window.autopilot && typeof window.autopilot.sendRoute === 'function') {
			window.autopilot.sendRoute({ action: 'disengage' });
			console.log('Sent disengage to main');
		} else {
			console.warn('autopilot API not available in preload');
		}
	}

	window.engageAutopilot = function (route) {
		sendEngage(route || sampleRoute());
	};

	window.disengageAutopilot = function () {
		sendDisengage();
	};

	document.addEventListener('DOMContentLoaded', () => {
		const engageBtn = document.getElementById('engage-ap');
		const disengageBtn = document.getElementById('disengage-ap');
		const toggle = document.getElementById('autopilot-toggle');
		const routeInput = document.getElementById('route-json');

		if (engageBtn) {
			engageBtn.addEventListener('click', () => {
				let route = sampleRoute();
				if (routeInput && routeInput.value) {
					try {
						route = JSON.parse(routeInput.value);
					} catch (err) {
						console.warn('Invalid JSON in route input, using sample route');
					}
				}
				sendEngage(route);
			});
		}

		if (disengageBtn) {
			disengageBtn.addEventListener('click', () => sendDisengage());
		}

		if (toggle) {
			toggle.addEventListener('change', (e) => {
				if (e.target.checked) {
					let route = sampleRoute();
					if (routeInput && routeInput.value) {
						try { route = JSON.parse(routeInput.value); } catch (err) { console.warn('Invalid JSON, using sample route'); }
					}
					sendEngage(route);
				} else {
					sendDisengage();
				}
			});
		}

		if (window.autopilot && typeof window.autopilot.onAck === 'function') {
			window.autopilot.onAck((data) => {
				console.log('Autopilot ack from main:', data);
			});
		}
	});

})();

