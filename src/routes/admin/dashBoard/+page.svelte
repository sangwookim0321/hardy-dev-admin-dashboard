<!-- 대시보드 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { storePath } from '$lib/store/store'
	import useApi from '$lib/util/api'

	const { httpGet, endPoints, statusHandler } = useApi()

	let currentPath

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
	})
</script>

<main>
	<div class="main_top_box">
		<img src="/imgs/icon_left.svg" alt="icon" />
		<span>대시보드</span>
	</div>
</main>
