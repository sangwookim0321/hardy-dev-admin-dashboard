<script>
	import { page } from '$app/stores.js'

	$: currentPath = $page.url.pathname
</script>

<div class="layout">
	<div class="sidebar">
		<p>Dashboard</p>
		<p>Settings</p>
		<p>Log out</p>
	</div>
	<div class="content">
		<slot />
	</div>
</div>

<style>
	.layout {
		display: flex;
		min-height: 100vh;
	}
	.sidebar {
		width: 250px;
		background-color: rgb(61, 61, 61);
		color: white;
		padding: 1rem;
		position: fixed;
		height: 100vh;
	}
	.content {
		margin-left: 250px;
		padding: 5rem 6rem;
	}
</style>
