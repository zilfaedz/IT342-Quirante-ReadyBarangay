package com.android.mobile

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class MobileCardAdapter(
    private var items: List<MobileCard>
) : RecyclerView.Adapter<MobileCardAdapter.CardViewHolder>() {

    class CardViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val title: TextView = view.findViewById(R.id.tv_card_title)
        val value: TextView = view.findViewById(R.id.tv_card_value)
        val hint: TextView = view.findViewById(R.id.tv_card_hint)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CardViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_mobile_card, parent, false)
        return CardViewHolder(view)
    }

    override fun onBindViewHolder(holder: CardViewHolder, position: Int) {
        val item = items[position]
        holder.title.text = item.title
        holder.value.text = item.value
        holder.hint.text = item.hint
    }

    override fun getItemCount(): Int = items.size

    fun submit(newItems: List<MobileCard>) {
        items = newItems
        notifyDataSetChanged()
    }
}
