function PlantTrackerDetailContent({ detail }) {
	return (
		<>
			<div className="detail-meta">
				<p>
					<strong>Stack:</strong> {detail.stack}
				</p>
				<p>
					<strong>Skills:</strong> {detail.skills}
				</p>
				<p>
					<strong>Status:</strong> {detail.status}
				</p>
			</div>

			<section className="detail-section">
				<h2>Overview</h2>
				{detail.overview.map((paragraph) => (
					<p key={paragraph.slice(0, 40)}>{paragraph}</p>
				))}
			</section>

			<section className="detail-section">
				<h2>Motivation</h2>
				{detail.motivation.map((paragraph) => (
					<p key={paragraph.slice(0, 40)}>{paragraph}</p>
				))}
			</section>

			<section className="detail-section">
				<h2>System architecture</h2>
				<figure className="detail-figure">
					<img
						src={detail.architectureImage}
						alt={detail.architectureCaption}
						className="detail-architecture-image"
					/>
					<figcaption>{detail.architectureCaption}</figcaption>
				</figure>
			</section>

			<section className="detail-section">
				<h2>Component decisions &amp; trade-offs</h2>
				{detail.componentDecisions.map((section) => (
					<article key={section.title} className="detail-challenge">
						<h3>{section.title}</h3>
						{section.paragraphs.map((paragraph) => (
							<p key={paragraph.slice(0, 40)}>{paragraph}</p>
						))}
						{section.list && (
							<ul>
								{section.list.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						)}
						{section.powerChain && (
							<p className="detail-power-chain">{section.powerChain}</p>
						)}
						{section.subsections?.map((sub) => (
							<div key={sub.title} className="detail-subsection">
								<h4>{sub.title}</h4>
								{sub.paragraphs.map((paragraph) => (
									<p key={paragraph.slice(0, 40)}>{paragraph}</p>
								))}
								{sub.lesson && (
									<p className="detail-lesson">
										<strong>Lesson:</strong> {sub.lesson}
									</p>
								)}
							</div>
						))}
						{section.batteryEstimate && (
							<div className="detail-battery-estimate">
								<strong>Battery life estimation:</strong>
								<ul>
									{section.batteryEstimate.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</div>
						)}
						{section.closing && <p>{section.closing}</p>}
						{section.note && <p className="detail-note">{section.note}</p>}
					</article>
				))}
			</section>

			<section className="detail-section">
				<h2>Firmware</h2>
				<p>{detail.firmware.intro}</p>
				<ul>
					{detail.firmware.decisions.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
				<pre className="detail-code-block">
					<code>{detail.firmware.code}</code>
				</pre>
				{detail.firmware.afterCode.map((paragraph) => (
					<p key={paragraph.slice(0, 40)}>{paragraph}</p>
				))}
				<p className="detail-gap">{detail.firmware.gap}</p>
			</section>

			<section className="detail-section">
				<h2>Hardware assembly</h2>
				<article className="detail-challenge">
					<h3>{detail.hardwareAssembly.solderingLessons.title}</h3>
					<p>{detail.hardwareAssembly.solderingLessons.intro}</p>
					<ul>
						{detail.hardwareAssembly.solderingLessons.list.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</article>
				<article className="detail-challenge">
					<h3>{detail.hardwareAssembly.expansionShield.title}</h3>
					<p>{detail.hardwareAssembly.expansionShield.intro}</p>
					<ul>
						{detail.hardwareAssembly.expansionShield.list.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
					<p>{detail.hardwareAssembly.expansionShield.closing}</p>
					<p className="detail-lesson">
						<strong>The lesson:</strong>{" "}
						{detail.hardwareAssembly.expansionShield.lesson}
					</p>
				</article>
			</section>

			<section className="detail-section">
				<h2>What I would do differently</h2>
				<ul>
					{detail.doDifferently.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			</section>

			<section className="detail-section">
				<h2>What worked well</h2>
				<ul>
					{detail.workedWell.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			</section>

			<section className="detail-section">
				<h2>Next steps</h2>
				<ul>
					{detail.nextSteps.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			</section>

			<section className="detail-section">
				<h2>Skills demonstrated</h2>
				<ul>
					{detail.skillsDemonstrated.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			</section>
		</>
	);
}

export default PlantTrackerDetailContent;
