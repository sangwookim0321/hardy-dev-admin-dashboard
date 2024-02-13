<!-- 토큰 리프레시 체크 레이아웃 -->
<script>
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { showToast } from '$lib/util/alerts'
	import useApi from '$lib/util/api'
	import { storeAccessToken } from '$lib/store/store'
</script>

<slot />
