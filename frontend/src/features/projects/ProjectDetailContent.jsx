import { toParagraphs } from "../../shared/utils/projectText";

function Paragraphs({ text, className }) {
	return toParagraphs(text).map((paragraph, index) => (
		<p key={`${index}-${paragraph.slice(0, 24)}`} className={className}>
			{paragraph}
		</p>
	));
}

function normalizeChallenges(challenges = []) {
	const notes = [];
	const items = [];

	for (const entry of challenges) {
		if (typeof entry === "string") {
			notes.push(entry.trim());
			continue;
		}
		if (entry && typeof entry === "object") {
			items.push({
				...entry,
				problem: entry.problem,
				solution: Array.isArray(entry.solution) ? entry.solution : [],
			});
		}
	}

	return { notes, items };
}

function ProjectDetailContent({ detail }) {
	const { notes: challengeNotes, items: challengeItems } = normalizeChallenges(
		detail.challenges,
	);

	return (
		<>
			<Paragraphs text={detail.pitch} className="project-detail-pitch" />

			<section className="detail-section">
				<h2>Tech stack</h2>
				<div className="detail-table-wrap">
					<table className="detail-table">
						<thead>
							<tr>
								<th>Layer</th>
								<th>Technologies</th>
							</tr>
						</thead>
						<tbody>
							{detail.techStack.map((row) => (
								<tr key={row.layer}>
									<td>{row.layer}</td>
									<td>{row.technologies}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="detail-section">
				<h2>Overview</h2>
				<Paragraphs text={detail.overview} />
			</section>

			<section className="detail-section">
				<h2>Problems encountered &amp; solutions</h2>
				{challengeNotes.map((note) => (
					<p key={note.slice(0, 48)} className="detail-challenge-note">
						{note}
					</p>
				))}
				{challengeItems.map((challenge, index) => (
					<article key={challenge.title || index} className="detail-challenge">
						<h3>
							{index + 1}. {challenge.title}
						</h3>
						<div>
							<strong>Problem:</strong>
							<Paragraphs text={challenge.problem} />
						</div>
						<div>
							<strong>Solution:</strong>
							<ul>
								{challenge.solution.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						</div>
						{challenge.codeRefs?.length > 0 && (
							<div className="detail-code-refs">
								<strong>Key files:</strong>
								<ul>
									{challenge.codeRefs.map((ref) => (
										<li key={ref}>
											<code>{ref}</code>
										</li>
									))}
								</ul>
							</div>
						)}
					</article>
				))}
			</section>

			<section className="detail-section">
				<h2>Interesting code to highlight</h2>
				<div className="detail-table-wrap">
					<table className="detail-table">
						<thead>
							<tr>
								<th>Topic</th>
								<th>File</th>
								<th>Why it&apos;s interesting</th>
							</tr>
						</thead>
						<tbody>
							{detail.codeHighlights.map((row) => (
								<tr key={row.file}>
									<td>{row.topic}</td>
									<td>
										<code>{row.file}</code>
									</td>
									<td>{row.why}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="detail-section">
				<h2>CV summary</h2>
				<h3 className="detail-subheading">Short version</h3>
				<p>{detail.cvShort}</p>
				<h3 className="detail-subheading">Key challenges</h3>
				<ul>
					{detail.cvMedium.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			</section>

			<section className="detail-section">
				<h2>Technologies</h2>
				<div className="detail-tags">
					{detail.techTags.map((tag) => (
						<span key={tag} className="detail-tag">
							{tag}
						</span>
					))}
				</div>
			</section>

			<section className="detail-section">
				<h2>Lessons learned</h2>
				<Paragraphs text={detail.lessonsLearned} />
			</section>
		</>
	);
}

export default ProjectDetailContent;
