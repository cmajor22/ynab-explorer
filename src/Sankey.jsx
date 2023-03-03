import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const SankeyChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove()
    svg
      .attr("width", 800)
      .attr("height", 700)

    const width = 800;
    const height = '700';

    const s = sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .size([width, height])

    const { nodes, links } = s(data);

    svg.append('g')
      .selectAll('.link')
      .data(links)
      .enter().append('path')
        .attr('class', 'link')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke-width', d => Math.max(1, d.width))
        .style('fill', 'none')
        .style('stroke-opacity', .3)
        // .style('stroke', '#FFF')
        .style('stroke', d => {
          if (d.target.color) {
            return d.target.color;
          }
          return d.source.color;
        });

    svg.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter().append('rect')
        .attr('class', 'node')
        .attr('x', d => d.x0 + 1)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('marginBottom', 5)
        .style('fill', d => d.color)
        .style('fill-opacity', 0.5)
        .style('marginLeft', '20px')
        // .style('stroke', '#000');

  }, [data]);

  return (
    <svg ref={chartRef}></svg>
  );
};

export default SankeyChart;