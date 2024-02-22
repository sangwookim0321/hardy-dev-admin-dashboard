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

<h1>
	대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드
	대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드
	대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드대시보드
</h1>
