<script>
	let count1 = 0;
	let count2 = 0;
	function increaseCount1() { count1++ }
	$: if(count2 < 10) { increaseCount1() }
	$: if(count1 < 10) { count2++ }
</script>

<button on:click={() => count1++}>{count1} / {count2}</button>
