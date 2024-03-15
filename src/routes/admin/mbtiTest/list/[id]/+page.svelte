<!-- MBTI 테스트 상세 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { goto } from '$app/navigation'
	import { storePath, storeLoadingState } from '$lib/store/store'
	import { showToast } from '$lib/util/alerts'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import useApi from '$lib/util/api'

	const { httpGet, httpPutFormData, endPoints, statusHandler } = useApi()

	let currentPath
	let pageId = $page.params.id

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
		storeLoadingState.set(true)
		getItem()
	})

	let test = {
		title: '테스트 타이틀',
		sub_title: '테스트 서브 타이틀',
		description: '설명설명',
		img_url: '',
		img_preview: '',
		type_category: '과일',
		types: [
			{ type: 'INTP', description: 'INTP 설명' },
			{ type: 'ESFJ', description: 'ESFJ 설명' }
		],
		questions: [
			{
				content: '질문 내용',
				sub_img_url: '',
				sub_img_preview: '',
				old_sub_img_url: '',
				setQuestions: [
					{ set_content: '선택지1', types: [] },
					{ set_content: '선택지2', types: [] }
				]
			},
			{
				content: '질문 내용',
				sub_img_url: '',
				sub_img_preview: '',
				old_sub_img_url: '',
				setQuestions: [
					{ set_content: '선택지1', types: [] },
					{ set_content: '선택지2', types: [] }
				]
			}
		]
	}

	let oldImageUrl = ''
	let deleteTypeList = []
	let deleteList = []

	function handleFileChange(event) {
		const file = event.target.files[0]
		if (file) {
			let fileReader = new FileReader()
			fileReader.readAsDataURL(file)
			fileReader.onload = () => {
				test.img_preview = fileReader.result
				test.img_url = file
			}
		}
		event.target.value = ''
	}

	function handleSubFileChange(event, index) {
		const file = event.target.files[0]
		if (file) {
			let fileReader = new FileReader()
			fileReader.readAsDataURL(file)
			fileReader.onload = () => {
				test.questions[index].sub_img_preview = fileReader.result
				test.questions[index].sub_img_url = file
			}
		}
		event.target.value = ''
	}

	function addType() {
		const newItem = { type: '', description: '', isNew: true }

		test.types = [...test.types, newItem]

		setTimeout(() => {
			window.scrollBy({
				top: 300,
				left: 0,
				behavior: 'smooth'
			})
		}, 100)
	}

	function addQuestion() {
		const newItem = {
			isNew: true,
			content: '질문 내용',
			sub_img_url: '',
			sub_img_preview: '',
			setQuestions: [
				{ set_content: '선택지1', types: [] },
				{ set_content: '선택지2', types: [] }
			]
		}

		test.questions = [...test.questions, newItem]

		setTimeout(() => {
			window.scrollBy({
				top: 300,
				left: 0,
				behavior: 'smooth'
			})
		}, 100)
	}

	function handleTypeChange(questionIndex, qIndex, event) {
		const selectedType = event.target.value
		if (!selectedType) return

		const currentTypes = test.questions[questionIndex].setQuestions[qIndex].types
		if (!currentTypes.includes(selectedType)) {
			test.questions[questionIndex].setQuestions[qIndex].types = [...currentTypes, selectedType]
			// 선택 후 셀렉트 박스 초기화
			test.questions[questionIndex].setQuestions[qIndex].selectedType = ''
		}
	}

	function handleTypeRemove(questionIndex, qIndex, typeIndex) {
		let questionTypes = test.questions[questionIndex].setQuestions[qIndex].types

		questionTypes.splice(typeIndex, 1)

		test.questions[questionIndex].setQuestions[qIndex].types = questionTypes
	}

	function removeField(index, field, id) {
		if (field === 'type') {
			test.types.splice(index, 1)

			test = { ...test }

			if (id) {
				deleteTypeList.push(id)
				console.log('deleteTypeList', deleteTypeList)
			}
		} else if (field === 'question') {
			test.questions.splice(index, 1)

			test = { ...test }
			if (id) {
				deleteList.push(id)
				console.log('deleteList', deleteList)
			}
		}
	}

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	async function saveTest() {
		if (!test.img_preview) {
			sweetToast('이미지를 업로드해주세요', 'warning')
			return
		}
		if (!test.title) {
			sweetToast('제목을 입력해주세요', 'warning')
			return
		}
		if (!test.sub_title) {
			sweetToast('서브 제목을 입력해주세요', 'warning')
			return
		}
		if (!test.description) {
			sweetToast('설명을 입력해주세요', 'warning')
			return
		}
		if (!test.type_category) {
			sweetToast('타입 카테고리를 입력해주세요', 'warning')
			return
		}

		for (let i = 0; i < test.types.length; i++) {
			if (!test.types[i].type) {
				sweetToast('타입을 입력해주세요', 'warning')
				return
			}
			if (!test.types[i].description) {
				sweetToast('타입 설명을 입력해주세요', 'warning')
				return
			}
		}

		for (let i = 0; i < test.questions.length; i++) {
			// 질문 내용이 있는지 확인
			if (!test.questions[i].content) {
				sweetToast('질문을 입력해주세요', 'warning')
				return
			}

			for (let j = 0; j < test.questions[i].setQuestions.length; j++) {
				// 각 선택지의 내용이 있는지 확인
				if (!test.questions[i].setQuestions[j].set_content) {
					sweetToast('모든 선택지에 내용을 입력해주세요', 'warning')
					return
				}
				// 각 선택지에 최소 하나의 타입이 지정되어 있는지 확인
				if (test.questions[i].setQuestions[j].types.length === 0) {
					sweetToast('모든 선택지에 타입을 최소 하나 이상 선택해주세요', 'warning')
					return
				}
			}
		}

		let formData = new FormData()
		formData.append('title', test.title)
		formData.append('sub_title', test.sub_title)
		formData.append('description', test.description)
		if (test.img_url instanceof File) {
			formData.append('img', test.img_url)
		}
		formData.append('oldImageUrl', oldImageUrl)
		formData.append('deleteList', JSON.stringify(deleteList))
		formData.append('deleteTypeList', JSON.stringify(deleteTypeList))
		formData.append('type_category', test.type_category)
		formData.append('types', JSON.stringify(test.types))

		const questionsData = test.questions.map((item, index) => {
			const { sub_img_url, setQuestions, isNew, ...rest } = item

			// 서브 이미지 파일이 있는 경우 formData 에 파일 추가
			if (sub_img_url instanceof File) {
				formData.append(`sub_img_url_${index}`, sub_img_url)
			}

			// 기존 서브 이미지 URL 전송 (수정 안됐을 경우)
			if (item.old_sub_img_url && !(sub_img_url instanceof File)) {
				formData.append(`old_sub_img_url_${index}`, item.old_sub_img_url)
			}

			if (isNew) {
				return { ...rest, setQuestions }
			} else {
				return { ...rest, setQuestions, id: item.id }
			}
		})

		formData.append('questions', JSON.stringify(questionsData))

		console.log('title', test.title)
		console.log('sub_title', test.sub_title)
		console.log('description', test.description)
		console.log('img_url', test.img_url)
		console.log('oldImageUrl', oldImageUrl)
		console.log('deleteList', deleteList)
		console.log('deleteTypeList', deleteTypeList)
		console.log('type_category', test.type_category)
		console.log('types', test.types)
		console.log('questions', questionsData)

		await httpPutFormData(
			`${endPoints.MBTI_TEST}/${pageId}`,
			'mbtiTestEdit',
			formData,
			true,
			(res) => {
				sweetToast('테스트 수정 완료', 'success')
				getItem()
			},
			(err) => {
				console.error(err)
				statusHandler(
					err.status,
					() => {
						sweetToast(err.message, 'error')
					},
					async () => {
						await goto('/')
						sweetToast(err.message, 'error')
					}
				)
			},
			null,
			() => {}
		)
	}

	function setImageUrl(imgUrl) {
		const domainPath = 'https://aqnmhrbebgwoziqtyyns.supabase.co/storage/v1/object/public/'
		test.img_preview = domainPath + imgUrl
	}

	function setImageUrlForQuestions(questions) {
		// 서브 이미지 도메인 경로 셋팅
		const domainPath = 'https://aqnmhrbebgwoziqtyyns.supabase.co/storage/v1/object/public/'
		questions.forEach((question) => {
			question.sub_img_preview = domainPath + question.sub_img_url
		})
	}

	async function getItem() {
		await httpGet(
			`${endPoints.MBTI_TEST}/${pageId}`,
			`mbtiTestDetail/${pageId}`,
			true,
			(res) => {
				test = res.data.data
				oldImageUrl = test.img_url
				setImageUrl(test.img_url)
				setImageUrlForQuestions(test.questions)

				test.questions.forEach((question) => {
					if (question.sub_img_url) {
						question.old_sub_img_url = question.sub_img_url
					}
				})

				test.img_url = ''
			},
			(err) => {
				console.error(err)
				statusHandler(
					err.status,
					() => {
						sweetToast(err.message, 'error')
					},
					async () => {
						await goto('/')
						sweetToast(err.message, 'error')
					}
				)
			},
			() => {},
			() => {
				storeLoadingState.set(false)
			}
		)
	}

	function movePage() {
		history.back()
	}
</script>

{#if $storeLoadingState}
	<LoadingSpinner />
{:else}
	<main>
		<div class="main_top_box">
			<img
				style="cursor: pointer;"
				src="/imgs/icon_left.svg"
				alt="icon"
				on:click={() => {
					movePage()
				}}
			/>
			<span style="color: var(--main-bg-violet);">MBTI 테스트 상세</span>
		</div>

		<div class="main_box">
			<div class="test_info">
				<label for="file_upload" class="custom_file_upload">
					<div style="cursor: pointer;" class="image_upload">
						{#if test.img_preview}
							<img class="img_preview" src={test.img_preview} alt="이미지" />
						{:else}
							<img src="/imgs/icon_add.svg" alt="이미지 추가" />
						{/if}
						{#if test.img_preview}
							<img
								class="img_remove"
								src="/imgs/icon_remove.svg"
								alt="이미지 삭제"
								on:click={(event) => {
									event.preventDefault()
									test.img_preview = ''
									test.img_url = ''
								}}
							/>
						{/if}
					</div>
					<input
						type="file"
						id="file_upload"
						style="display: none;"
						class="file_upload"
						on:change={handleFileChange}
					/>
				</label>
				<div class="test_details">
					<label for="title">제목</label>
					<input type="text" id="title" class="title" bind:value={test.title} />
					<label for="sub_title">서브 제목</label>
					<input type="text" id="sub_title" class="sub_title" bind:value={test.sub_title} />
					<label for="description">설명</label>
					<textarea id="description" class="description" bind:value={test.description}></textarea>
					<label for="type_category">타입 카테고리</label>
					<input
						type="text"
						id="type_category"
						class="type_category"
						bind:value={test.type_category}
					/>
				</div>
			</div>

			<hr />

			<div class="types">
				{#each test.types as type, index}
					{#if test.types.length > 2}
						<img
							class="type_remove_img"
							src="/imgs/icon_remove.svg"
							alt="remove"
							on:click={() => removeField(index, 'type', type.id)}
						/>
					{/if}
					<div class="type_set">
						<label for={`option_${index}`}>{index + 1}번 타입</label>
						<input type="text" id={`option_${index}`} bind:value={type.type} />
						<textarea class="typeDescription" bind:value={type.description} placeholder="타입 설명"
						></textarea>
					</div>
				{/each}
				<button on:click={() => addType()}>타입 추가</button>
				<hr />
			</div>
			<div class="questions">
				{#each test.questions as question, index}
					<div class="question_set">
						<div class="question_set_01">
							<label for={`question_${index}`}>{index + 1}번 문항</label>
							{#if test.questions.length > 2}
								<img
									class="question_remove_img"
									src="/imgs/icon_remove.svg"
									alt="remove"
									on:click={() => removeField(index, 'question', question.id)}
								/>
							{/if}
						</div>

						<div style="display: flex; flex-direction: column; align-items: center;">
							<label for={`sub_image_${index}`}>상세 이미지(선택사항)</label>
							<label for={`sub_file_upload_${index}`} class="custom_file_upload">
								<div style="cursor: pointer;" class="image_upload">
									{#if question.sub_img_preview}
										<img class="img_preview" src={question.sub_img_preview} alt="이미지" />
									{:else}
										<img src="/imgs/icon_add.svg" alt="이미지 추가" />
									{/if}
									{#if question.sub_img_preview}
										<img
											class="img_remove"
											src="/imgs/icon_remove.svg"
											alt="이미지 삭제"
											on:click={(event) => {
												event.preventDefault()
												question.sub_img_preview = ''
												question.sub_img_url = ''
											}}
										/>
									{/if}
								</div>
								<input
									type="file"
									id={`sub_file_upload_${index}`}
									style="display: none;"
									class="file_upload"
									on:change={(event) => handleSubFileChange(event, index)}
								/>
							</label>
						</div>
						<div class="question_content_title">
							<span>질문 내용</span>
							<input type="text" id={`question_${index}`} bind:value={question.content} />
						</div>

						{#each question.setQuestions as setQ, qIndex}
							<div class="question_inner">
								<div class="question_inner_01">
									<select
										on:change={(event) => handleTypeChange(index, qIndex, event)}
										bind:value={test.questions[index].setQuestions[qIndex].selectedType}
									>
										<option value="">선택</option>
										{#each test.types as type, typeIndex}
											<option value={type.type}>{type.type}</option>
										{/each}
									</select>
								</div>
								<div class="question_inner_02">
									<input
										type="text"
										id={`question_${index}_${qIndex}`}
										bind:value={setQ.set_content}
									/>
									<div class="q_type_inner">
										{#each setQ.types as type, typeIndex}
											<div class="q_type_inner_01">
												<p style="color: var(--main-bg-purple)">{type}</p>
												<img
													class="q_type_remove_img"
													src="/imgs/icon_remove.svg"
													alt="remove"
													on:click={() => handleTypeRemove(index, qIndex, typeIndex)}
												/>
											</div>
										{/each}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/each}
				<button on:click={() => addQuestion()}>문항 추가</button>
				<hr />
			</div>
			<button class="save_button" on:click={saveTest}>저장</button>
		</div>
	</main>
{/if}

<style>
	.test_info {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}
	.test_details {
		display: flex;
		flex-direction: column;
		margin-top: 2rem;
		width: 50%;
	}
	.image_upload {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 300px;
		height: 300px;
		background-color: var(--main-bg-lightGray);
		border-radius: 10px;
	}
	.types {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 50%;
	}
	.type_set {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	.type_remove_img {
		width: 3rem;
		cursor: pointer;
	}
	.description {
		height: 150px;
	}
	.questions {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 50%;
	}
	.question_set {
		display: flex;
		flex-direction: column;
		width: 100%;
		margin: 2rem 0;
	}
	.question_set_01 {
		display: flex;
	}
	.question_inner {
		display: flex;
		flex-direction: column;
	}
	.question_inner_01 {
		display: flex;
		justify-content: flex-end;
		width: 100%;
	}
	.question_inner_02 {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	.question_inner_02 input {
		border: 1px solid var(--main-bg-gray);
		border-radius: 10px;
		padding: 1.2rem;
	}
	.question_content_title {
		display: flex;
		flex-direction: column;
		margin: 1rem 0;
	}
	.question_content_title input {
		border: 1px solid var(--main-bg-gray);
		border-radius: 10px;
		padding: 1.2rem;
	}
	.q_type_inner p {
		font-size: 1.6rem;
		margin: 0.5rem;
	}
	.q_type_inner {
		display: flex;
		flex-direction: row;
	}
	.q_type_remove_img {
		cursor: pointer;
		width: 1.6rem;
	}
	.q_type_inner_01 {
		display: flex;
		align-items: center;
		margin-right: 1rem;
	}
	.question_remove_img {
		width: 2.4rem;
		cursor: pointer;
		margin-left: 1rem;
	}
	hr {
		width: 100%;
		margin: 5rem 0;
		border: 1px solid var(--main-bg-purple);
	}
	input {
		margin: 2rem 0;
		border: none;
		border-bottom: 1px solid var(--main-bg-gray);
		outline: none;
		padding: 0.5rem 0;
		box-sizing: border-box;
	}
	input:focus {
		border-color: var(--main-bg-purple);
		outline: none;
	}
	textarea {
		border: none;
		outline: none;
		border-bottom: 1px solid #ccc;
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0;
		margin-bottom: 2rem;
		font-size: 1.5rem;
	}
	.typeDescription {
		height: 100px;
	}
	textarea:focus {
		border-color: var(--main-bg-purple);
		outline: none;
	}
	button {
		margin: 1rem 0;
		padding: 1rem 1.2rem;
		border: none;
		border-radius: 10px;
		background-color: var(--main-bg-lightGray);
		color: var(--main-bg-white);
		cursor: pointer;
	}
	button:hover {
		background-color: var(--main-bg-gray);
	}
	label {
		margin: 1rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}
	select {
		appearance: none;
		padding: 0.5rem 2rem;
		border: 1px solid var(--main-bg-lightGray-02);
		background-color: var(--main-bg-white);
		cursor: pointer;
	}
	select:focus {
		outline: none;
		border-color: var(--main-bg-lightGray);
	}
	select option {
		border: none;
		outline: none;
		background-color: var(--main-bg-lightGray-02);
	}
	.save_button {
		margin-top: 3rem;
		padding: 1rem 6rem;
		border: none;
		border-radius: 10px;
		background-color: var(--main-bg-purple);
		color: white;
		cursor: pointer;
	}
	.save_button:hover {
		background-color: var(--main-bg-darkPurple);
	}
	.img_preview {
		width: 300px;
		height: 300px;
		object-fit: cover;
		border-radius: 10px;
	}
	.img_remove {
		position: absolute;
		top: 2%;
		right: 2%;
		cursor: pointer;
	}

	@media (max-width: 768px) {
		.test_details {
			width: 100%;
		}
		.main_top_box {
			margin: 2rem 0;
		}
		.main_top_box img {
			width: 1rem;
		}
		.main_top_box span {
			font-size: 1.5rem;
		}
		input {
			font-size: 1.5rem;
		}
		label {
			font-size: 1.5rem;
		}
		textarea {
			font-size: 1.5rem;
		}
		.types {
			width: 100%;
		}
		.save_button {
			padding: 1rem 4rem;
		}
		.custom_file_upload {
			width: 100%;
		}
		.image_upload {
			width: 100%;
		}
		.img_preview {
			width: 100%;
			height: 300px;
		}
		.img_remove {
			position: absolute;
			top: 2%;
			right: 1.5%;
			cursor: pointer;
		}
		.questions {
			width: 100%;
		}
	}
</style>
