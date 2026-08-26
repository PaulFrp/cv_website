import { toParagraphs } from "../../shared/utils/projectText";

/** Renders a string or an array of strings as paragraphs. */
export function Paragraphs({ text, className }) {
	return toParagraphs(text).map((paragraph, index) => (
		<p key={`${index}-${paragraph.slice(0, 24)}`} className={className}>
			{paragraph}
		</p>
	));
}

export function BulletList({ items }) {
	if (!items?.length) return null;

	return (
		<ul>
			{items.map((item) => (
				<li key={item}>{item}</li>
			))}
		</ul>
	);
}

export function DetailSection({ title, children }) {
	return (
		<section className="detail-section">
			<h2>{title}</h2>
			{children}
		</section>
	);
}

/** `rows` is a list of `{ key, cells }`, where cells match `headers` in order. */
export function DetailTable({ headers, rows }) {
	return (
		<div className="detail-table-wrap">
			<table className="detail-table">
				<thead>
					<tr>
						{headers.map((header) => (
							<th key={header}>{header}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.key}>
							{row.cells.map((cell, index) => (
								<td key={headers[index]}>{cell}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
