function ProjectDetailContent({ detail }) {
	return (
		<>
			<p className="project-detail-pitch">{detail.pitch}</p>

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
				<p>{detail.overview}</p>
			</section>

			<section className="detail-section">
				<h2>Problems encountered &amp; solutions</h2>
				{detail.challenges.map((challenge, index) => (
					<article key={challenge.title} className="detail-challenge">
						<h3>
							{index + 1}. {challenge.title}
						</h3>
						<p>
							<strong>Problem:</strong> {challenge.problem}
						</p>
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
				<p>{detail.lessonsLearned}</p>
			</section>
		</>
	);
}

export default ProjectDetailContent;
