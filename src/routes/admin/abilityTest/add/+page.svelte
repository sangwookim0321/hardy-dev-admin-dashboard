<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { storePath } from '$lib/store/store'

	let currentPath

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
		console.log($storePath)
	})

	let items = [{ question_list: [] }]

	function addQuestion() {
		items = [...items, { question_list: [] }]
	}

	function addOption(index) {
		items[index].question_list = [...items[index].question_list, '']
	}

	function saveTest() {
		console.log(items)
	}
</script>

<main>
	<div class="main_top_box">
		<img src="/icon_left.svg" alt="icon" />
		<span>능력고사 테스트 추가</span>
	</div>

	<div class="main_box">
		<div class="test_info">
			<div class="image_upload">
				<!-- <input type="file" accept="image/*" /> -->
				<img src="/icon_add.svg" alt="이미지 추가" />
				<!-- <img
						src=""
						id="preview"
						alt="img"
						style="object-fit: cover; margin-top: 6px; width: 200px; height: 200px;"
					/> -->
			</div>
			<div class="test_details">
				<label for="title">제목</label>
				<input type="text" id="title" class="title" />
				<label for="sub_title">서브 제목</label>
				<input type="text" id="sub_title" class="sub_title" />
				<label for="description">설명</label>
				<textarea id="description" class="description"></textarea>
			</div>
		</div>

		<hr />

		<div class="questions">
			{#each items as item, index}
				<label for="question_number">{index + 1}번</label>
				<div class="question_set">
					<label for="question_number">질문 번호</label>
					<input type="number" id="question_number" class="question_number" />
					<label for="question_name">질문 이름</label>
					<input type="text" id="question_name" class="question_name" />
					{#each item.question_list as question, index2}
						<label for="question_list">{index2 + 1}번 문제</label>
						<input
							type="text"
							id="question_list"
							placeholder="객관식 리스트"
							class="question_list"
						/>
					{/each}
					<button on:click={() => addOption(index)}>옵션(객관식) 추가</button>
					<label for="question_etc">기타 문제설명</label>
					<input type="text" id="question_etc" class="question_etc" />
					<label for="answer">정답</label>
					<input type="number" id="answer" class="answer" />
					<label for="score">배점</label>
					<input type="number" id="score" class="score" />
					<hr />
				</div>
			{/each}
			<button on:click={addQuestion}>질문 추가</button>
		</div>
		<button on:click={saveTest}>저장</button>
	</div>
</main>

<style>
	.main_top_box {
		display: flex;
		align-items: center;
		margin-bottom: 5rem;
	}
	.main_top_box img {
		margin-right: 10px;
		width: 1rem;
	}
	.main_top_box span {
		font-size: 1.5rem;
		color: var(--main-bg-gray);
	}
	.main_box {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.test_info {
		display: flex;
		flex-direction: column;
	}
	.test_details {
		display: flex;
		flex-direction: column;
	}
	.image_upload {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 300px;
		height: 300px;
		background-color: var(--main-bg-lightGray);
		border-radius: 10px;
	}
	.questions {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 30%;
	}
	.question_set {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	.description {
		height: 100px;
	}
	hr {
		width: 100%;
		margin: 3rem 0;
		border: 1px solid var(--main-bg-purple);
	}
	input {
		margin: 1rem 0;
		border: none;
		border-bottom: 1px solid var(--main-bg-gray);
		outline: none;
		padding: 0.5rem 0;
		box-sizing: border-box;
	}
	textarea {
		border: none;
		outline: none;
		border-bottom: 1px solid #ccc;
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0;
	}
	button {
		margin: 1rem 0;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 10px;
		background-color: var(--main-bg-lightGray);
		cursor: pointer;
	}
	label {
		margin-top: 1rem;
		font-size: 0.9rem;
	}
</style>
